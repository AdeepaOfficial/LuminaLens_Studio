$ErrorActionPreference = "Stop"

Write-Host "Starting LuminaServer in background..."
$proc = Start-Process -FilePath "java" -ArgumentList "-cp bin server.LuminaServer 8080" -WorkingDirectory $PSScriptRoot -PassThru -WindowStyle Hidden

try {
    # Wait for server to listen
    Start-Sleep -Seconds 2

    Write-Host "`n1. Testing GET /api/albums..."
    $resp = Invoke-RestMethod -Uri "http://localhost:8080/api/albums" -Method Get
    Write-Host "Total albums retrieved: $($resp.Count)"
    if ($resp.Count -ne 4) { throw "Expected 4 albums, got $($resp.Count)" }
    Write-Host "Album 0 title: $($resp[0].title)"
    Write-Host "Album 0 slug: $($resp[0].slug)"
    Write-Host "Album 0 coverImage: $($resp[0].coverImage)"

    Write-Host "`n2. Testing GET /api/albums/wedding-nimal-kavindi..."
    $slugResp = Invoke-RestMethod -Uri "http://localhost:8080/api/albums/wedding-nimal-kavindi" -Method Get
    Write-Host "Slug title: $($slugResp.title)"
    Write-Host "Photo count: $($slugResp.photos.Count)"
    if ($slugResp.photos.Count -lt 1) { throw "Photos empty for slug!" }
    Write-Host "Photo 0 URL: $($slugResp.photos[0].url)"
    Write-Host "Photo 0 Thumbnail: $($slugResp.photos[0].thumbnailUrl)"

    Write-Host "`n3. Testing POST /api/auth/login (bad password)..."
    try {
        Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" -Method Post -Body '{"password":"wrong"}' -ContentType "application/json"
        throw "Should have failed with 401"
    } catch {
        Write-Host "Correctly rejected bad password (status: $($_.Exception.Response.StatusCode))"
    }

    Write-Host "`n4. Testing POST /api/auth/login (correct password)..."
    $loginResp = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" -Method Post -Body '{"password":"admin123"}' -ContentType "application/json"
    $token = $loginResp.token
    Write-Host "Logged in successfully. Token: $token"

    Write-Host "`n5. Testing GET /api/auth/status..."
    $statusResp = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/status" -Headers @{ "Authorization" = "Bearer $token" }
    Write-Host "Auth status: $($statusResp.authenticated)"
    if (-not $statusResp.authenticated) { throw "Auth status should be true" }

    Write-Host "`n6. Testing POST /api/drive/transform..."
    $transResp = Invoke-RestMethod -Uri "http://localhost:8080/api/drive/transform" -Method Post -Body '{"url":"https://drive.google.com/file/d/1X9YZ_TestDriveFileId12345/view?usp=sharing"}' -ContentType "application/json"
    Write-Host "Transformed File ID: $($transResp.fileId)"
    Write-Host "Transformed Display URL: $($transResp.url)"
    Write-Host "Transformed Thumbnail URL: $($transResp.thumbnailUrl)"
    if ($transResp.fileId -ne "1X9YZ_TestDriveFileId12345") { throw "File ID mismatch" }

    Write-Host "`n7. Testing POST /api/admin/albums (create new album with raw Google Drive links)..."
    $newAlbumBody = @"
{
    "title": "Wildlife of Yala - Safari Chronicles",
    "description": "Dramatic encounters with leopards, elephants, and exotic birds in Yala National Park.",
    "category": "Wildlife",
    "eventDate": "2026-06-01",
    "rawCoverUrl": "https://drive.google.com/file/d/1WL_Yala_Cover05/view",
    "photos": [
        {
            "rawUrl": "https://drive.google.com/file/d/1WL_Photo_Leopard01/view?usp=sharing",
            "caption": "Sri Lankan Leopard on Granite Rock"
        },
        {
            "rawUrl": "https://drive.google.com/open?id=1WL_Photo_Elephant02",
            "caption": "Tusker Elephant at Waterhole"
        }
    ]
}
"@
    $created = Invoke-RestMethod -Uri "http://localhost:8080/api/admin/albums" -Method Post -Body $newAlbumBody -ContentType "application/json" -Headers @{ "Authorization" = "Bearer $token" }
    Write-Host "Created Album ID: $($created.id)"
    Write-Host "Created Slug: $($created.slug)"
    Write-Host "Created Cover Image: $($created.coverImage)"
    Write-Host "Created Cover Thumbnail: $($created.coverThumbnail)"
    Write-Host "Photo 0 URL: $($created.photos[0].url)"
    Write-Host "Photo 1 URL: $($created.photos[1].url)"
    $createdId = $created.id

    Write-Host "`n8. Testing PUT /api/admin/albums/$createdId (update album)..."
    $updateBody = @"
{
    "title": "Wildlife of Yala - Grand Safari Chronicles",
    "description": "Updated description with sunset game drive highlights.",
    "published": true
}
"@
    $updated = Invoke-RestMethod -Uri "http://localhost:8080/api/admin/albums/$createdId" -Method Put -Body $updateBody -ContentType "application/json" -Headers @{ "Authorization" = "Bearer $token" }
    Write-Host "Updated title: $($updated.title)"
    if ($updated.title -ne "Wildlife of Yala - Grand Safari Chronicles") { throw "Title not updated" }

    Write-Host "`n9. Testing DELETE /api/admin/albums/$createdId..."
    $delResp = Invoke-RestMethod -Uri "http://localhost:8080/api/admin/albums/$createdId" -Method Delete -Headers @{ "Authorization" = "Bearer $token" }
    Write-Host "Delete response: $($delResp.message)"

    Write-Host "`n10. Testing Clean URL routing..."
    $homeHtml = (Invoke-WebRequest -Uri "http://localhost:8080/" -UseBasicParsing).Content
    Write-Host "GET / returns $($homeHtml.Length) chars"

    $albumsHtml = (Invoke-WebRequest -Uri "http://localhost:8080/albums" -UseBasicParsing).Content
    Write-Host "GET /albums returns $($albumsHtml.Length) chars"

    $albumSlugParamHtml = (Invoke-WebRequest -Uri "http://localhost:8080/album?slug=wedding-nimal-kavindi" -UseBasicParsing).Content
    Write-Host "GET /album?slug=wedding-nimal-kavindi returns $($albumSlugParamHtml.Length) chars"
    if ($albumSlugParamHtml -notmatch "album-gallery-grid") { throw "GET /album?slug= should return album viewer HTML!" }

    $albumViewerHtml = (Invoke-WebRequest -Uri "http://localhost:8080/album/wedding-nimal-kavindi" -UseBasicParsing).Content
    Write-Host "GET /album/wedding-nimal-kavindi returns $($albumViewerHtml.Length) chars"
    if ($albumViewerHtml -notmatch "album-gallery-grid") { throw "GET /album/{slug} should return album viewer HTML!" }

    $adminHtml = (Invoke-WebRequest -Uri "http://localhost:8080/admin" -UseBasicParsing).Content
    Write-Host "GET /admin returns $($adminHtml.Length) chars"

    Write-Host "`n11. Testing GET /api/album?slug=wedding-nimal-kavindi..."
    $singleAlbum = Invoke-RestMethod -Uri "http://localhost:8080/api/album?slug=wedding-nimal-kavindi" -Method Get
    Write-Host "Single album via query param slug: $($singleAlbum.title)"
    if ($singleAlbum.slug -ne "wedding-nimal-kavindi") { throw "Slug query param mismatch" }

    Write-Host "`n12. Testing sub-resource URL resolution under /album/css/style.css..."
    $cssContent = (Invoke-WebRequest -Uri "http://localhost:8080/album/css/style.css" -UseBasicParsing).Content
    Write-Host "GET /album/css/style.css returns $($cssContent.Length) chars"
    if ($cssContent.Length -lt 100) { throw "CSS sub-resource failed" }

    Write-Host "`n13. Testing alternative access key 'lumina2026'..."
    $login2Body = '{"password":"lumina2026"}'
    $login2Resp = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" -Method Post -Body $login2Body -ContentType "application/json"
    Write-Host "Alternative key login success: $($login2Resp.success)"
    if (-not $login2Resp.success) { throw "Alternative key login failed" }

    Write-Host "`nAll tests completed successfully!"
} finally {
    Write-Host "Stopping background server process..."
    if ($proc -and -not $proc.HasExited) {
        Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
    }
}
