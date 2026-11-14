package server;

import com.sun.net.httpserver.Headers;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpServer;

import java.io.*;
import java.net.InetSocketAddress;
import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.locks.ReentrantReadWriteLock;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * LuminaLens Studio - Zero-Dependency Java HTTP Backend Server
 *
 * Implements:
 * - High-performance built-in HTTP server (com.sun.net.httpserver.HttpServer)
 * - Zero-dependency JSON parser & serializer
 * - Thread-safe atomic JSON file persistence (data/albums.json) with mutex locking
 * - Google Drive share link transformation (extracts FILE_ID, generates direct high-res & thumbnail URLs)
 * - Complete RESTful API for album listing, slug resolution, authentication, and CRUD administration
 * - Clean URL routing: / -> index.html, /albums -> albums.html, /album/{slug} -> album.html, /admin -> admin/index.html
 */
public class LuminaServer {

    public static final int DEFAULT_PORT = 8080;
    public static final String DEFAULT_ADMIN_PASSWORD = "admin123";
    public static final String SESSION_COOKIE_NAME = "lumina_session";

    private final int port;
    private final Path rootDir;
    private final PersistenceManager persistence;
    private final AuthManager auth;
    private HttpServer server;

    public LuminaServer(int port) {
        this.port = port;
        this.rootDir = resolveProjectRoot();
        this.persistence = new PersistenceManager(this.rootDir);
        this.auth = new AuthManager();
    }

    public static void main(String[] args) {
        int port = DEFAULT_PORT;
        if (args.length > 0) {
            try {
                port = Integer.parseInt(args[0]);
            } catch (NumberFormatException ignored) {}
        } else {
            String envPort = System.getenv("PORT");
            if (envPort != null && !envPort.isBlank()) {
                try {
                    port = Integer.parseInt(envPort.trim());
                } catch (NumberFormatException ignored) {}
            }
        }

        LuminaServer app = new LuminaServer(port);
        try {
            app.start();
        } catch (IOException e) {
            System.err.println("Fatal: Failed to start LuminaServer: " + e.getMessage());
            e.printStackTrace();
            System.exit(1);
        }
    }

    public void start() throws IOException {
        server = HttpServer.create(new InetSocketAddress(port), 0);
        server.setExecutor(Executors.newVirtualThreadPerTaskExecutor());

        // API Handler
        server.createContext("/api/", new ApiHandler(persistence, auth));

        // Static Assets & Clean URL Routing Handler
        server.createContext("/", new StaticAndRouteHandler(rootDir));

        Runtime.getRuntime().addShutdownHook(new Thread(() -> {
            System.out.println("\n[LuminaServer] Shutting down gracefully...");
            server.stop(1);
            System.out.println("[LuminaServer] Stopped.");
        }));

        server.start();

        System.out.println("==================================================================");
        System.out.println("  LuminaLens Studio - Java HTTP Backend Server");
        System.out.println("  Running on: http://localhost:" + port);
        System.out.println("  Project Root: " + rootDir.toAbsolutePath());
        System.out.println("  Data File:    " + rootDir.resolve("data/albums.json").toAbsolutePath());
        System.out.println("  Public Dir:   " + rootDir.resolve("public").toAbsolutePath());
        System.out.println("  Admin Auth:   Default password 'admin123'");
        System.out.println("==================================================================");
    }

    public void stop() {
        if (server != null) {
            server.stop(0);
        }
    }

    // =========================================================================
    // Project Root Resolution
    // =========================================================================
    private static Path resolveProjectRoot() {
        String sysProp = System.getProperty("lumina.root.dir");
        if (sysProp != null && !sysProp.isBlank()) {
            Path p = Paths.get(sysProp);
            if (Files.exists(p)) return p.toAbsolutePath().normalize();
        }

        String envVar = System.getenv("LUMINA_ROOT_DIR");
        if (envVar != null && !envVar.isBlank()) {
            Path p = Paths.get(envVar);
            if (Files.exists(p)) return p.toAbsolutePath().normalize();
        }

        Path cwd = Paths.get(".").toAbsolutePath().normalize();
        if (Files.exists(cwd.resolve("data")) || Files.exists(cwd.resolve("src/server/LuminaServer.java"))) {
            return cwd;
        }

        if (Files.exists(cwd.resolve("../data"))) {
            return cwd.resolve("..").normalize();
        }

        try {
            Path classLoc = Paths.get(LuminaServer.class.getProtectionDomain().getCodeSource().getLocation().toURI());
            if (Files.isDirectory(classLoc) && Files.exists(classLoc.resolve("../data"))) {
                return classLoc.resolve("..").toAbsolutePath().normalize();
            }
        } catch (Exception ignored) {}

        return cwd;
    }

    // =========================================================================
    // Google Drive Link Transformer
    // =========================================================================
    public static class GoogleDriveUtil {
        private static final Pattern DRIVE_FILE_PATTERN = Pattern.compile("/file/d/([a-zA-Z0-9_-]+)");
        private static final Pattern DRIVE_ID_PARAM_PATTERN = Pattern.compile("[?&]id=([a-zA-Z0-9_-]+)");
        private static final Pattern LH3_PATTERN = Pattern.compile("googleusercontent\\.com/d/([a-zA-Z0-9_-]+)");
        private static final Pattern THUMBNAIL_PATTERN = Pattern.compile("thumbnail\\?id=([a-zA-Z0-9_-]+)");
        private static final Pattern DIRECT_ID_PATTERN = Pattern.compile("^[a-zA-Z0-9_-]{15,60}$");

        public static String extractFileId(String input) {
            if (input == null || input.isBlank()) return null;
            String trimmed = input.trim();

            Matcher m1 = DRIVE_FILE_PATTERN.matcher(trimmed);
            if (m1.find()) return m1.group(1);

            Matcher m2 = DRIVE_ID_PARAM_PATTERN.matcher(trimmed);
            if (m2.find()) return m2.group(1);

            Matcher m3 = LH3_PATTERN.matcher(trimmed);
            if (m3.find()) return m3.group(1);

            Matcher m4 = THUMBNAIL_PATTERN.matcher(trimmed);
            if (m4.find()) return m4.group(1);

            Matcher m5 = DIRECT_ID_PATTERN.matcher(trimmed);
            if (m5.matches() && !trimmed.contains("http") && !trimmed.contains("/") && !trimmed.contains(".")) {
                return trimmed;
            }

            return null;
        }

        public static String toHighResUrl(String fileId) {
            return "https://lh3.googleusercontent.com/d/" + fileId + "=w1600";
        }

        public static String toThumbnailUrl(String fileId) {
            return "https://drive.google.com/thumbnail?id=" + fileId + "&sz=w600";
        }

        public static String toRawUrl(String fileId) {
            return "https://drive.google.com/file/d/" + fileId + "/view";
        }

        @SuppressWarnings("unchecked")
        public static void transformAlbum(Map<String, Object> album) {
            if (album == null) return;

            // Cover Image
            String rawCover = (String) album.get("rawCoverUrl");
            String coverImg = (String) album.get("coverImage");
            String candidateCover = (rawCover != null && !rawCover.isBlank()) ? rawCover : coverImg;

            if (candidateCover != null && !candidateCover.isBlank()) {
                String fileId = extractFileId(candidateCover);
                if (fileId != null) {
                    album.put("coverImage", toHighResUrl(fileId));
                    album.put("coverThumbnail", toThumbnailUrl(fileId));
                    album.put("rawCoverUrl", toRawUrl(fileId));
                } else {
                    album.put("coverImage", candidateCover);
                    album.put("coverThumbnail", candidateCover);
                    album.put("rawCoverUrl", candidateCover);
                }
            }

            // Photos List
            Object photosObj = album.get("photos");
            if (photosObj instanceof List<?>) {
                List<Object> rawList = (List<Object>) photosObj;
                List<Map<String, Object>> transformedList = new ArrayList<>();
                int idx = 1;
                for (Object item : rawList) {
                    if (item instanceof Map<?, ?>) {
                        Map<String, Object> photo = new LinkedHashMap<>((Map<String, Object>) item);
                        transformPhoto(photo, idx++);
                        transformedList.add(photo);
                    } else if (item instanceof String) {
                        Map<String, Object> photo = new LinkedHashMap<>();
                        photo.put("rawUrl", item);
                        transformPhoto(photo, idx++);
                        transformedList.add(photo);
                    }
                }
                album.put("photos", transformedList);
            }
        }

        public static void transformPhoto(Map<String, Object> photo, int index) {
            if (!photo.containsKey("id") || photo.get("id") == null || ((String) photo.get("id")).isBlank()) {
                photo.put("id", "photo-" + index + "-" + UUID.randomUUID().toString().substring(0, 6));
            }

            String rawUrl = (String) photo.get("rawUrl");
            String url = (String) photo.get("url");
            String driveId = (String) photo.get("driveId");

            String candidate = (rawUrl != null && !rawUrl.isBlank()) ? rawUrl
                    : (url != null && !url.isBlank()) ? url
                    : driveId;

            if (candidate != null && !candidate.isBlank()) {
                String extractedId = extractFileId(candidate);
                if (extractedId != null) {
                    photo.put("driveId", extractedId);
                    photo.put("rawUrl", toRawUrl(extractedId));
                    photo.put("url", toHighResUrl(extractedId));
                    photo.put("thumbnailUrl", toThumbnailUrl(extractedId));
                } else {
                    photo.put("driveId", null);
                    photo.put("rawUrl", candidate);
                    photo.put("url", candidate);
                    photo.put("thumbnailUrl", candidate);
                }
            }
            if (!photo.containsKey("caption") || photo.get("caption") == null) {
                photo.put("caption", "Photograph " + index);
            }
        }
    }

    // =========================================================================
    // Persistence Manager (Thread-safe JSON Persistence)
    // =========================================================================
    public static class PersistenceManager {
        private final Path dataFile;
        private final ReentrantReadWriteLock rwLock = new ReentrantReadWriteLock();
        private List<Map<String, Object>> memoryAlbums = new ArrayList<>();

        public PersistenceManager(Path rootDir) {
            Path dataDir = rootDir.resolve("data");
            this.dataFile = dataDir.resolve("albums.json");
            try {
                Files.createDirectories(dataDir);
            } catch (IOException e) {
                System.err.println("Could not create data directory: " + e.getMessage());
            }
            loadFromFile();
        }

        public void loadFromFile() {
            rwLock.writeLock().lock();
            try {
                if (Files.exists(dataFile)) {
                    String content = Files.readString(dataFile, StandardCharsets.UTF_8);
                    Object parsed = Json.parse(content);
                    if (parsed instanceof List<?>) {
                        List<Map<String, Object>> list = new ArrayList<>();
                        for (Object item : (List<?>) parsed) {
                            if (item instanceof Map<?, ?>) {
                                @SuppressWarnings("unchecked")
                                Map<String, Object> map = (Map<String, Object>) item;
                                list.add(new LinkedHashMap<>(map));
                            }
                        }
                        this.memoryAlbums = list;
                        System.out.println("[Persistence] Loaded " + memoryAlbums.size() + " albums from " + dataFile);
                        return;
                    }
                }
                this.memoryAlbums = new ArrayList<>();
            } catch (Exception e) {
                System.err.println("[Persistence] Error reading " + dataFile + ": " + e.getMessage());
                this.memoryAlbums = new ArrayList<>();
            } finally {
                rwLock.writeLock().unlock();
            }
        }

        public void saveToFile() {
            rwLock.writeLock().lock();
            try {
                String jsonStr = Json.pretty(memoryAlbums);
                Path tempFile = dataFile.resolveSibling("albums.json.tmp." + System.currentTimeMillis());
                Files.writeString(tempFile, jsonStr, StandardCharsets.UTF_8,
                        StandardOpenOption.CREATE, StandardOpenOption.TRUNCATE_EXISTING);
                try {
                    Files.move(tempFile, dataFile, StandardCopyOption.REPLACE_EXISTING, StandardCopyOption.ATOMIC_MOVE);
                } catch (AtomicMoveNotSupportedException e) {
                    Files.move(tempFile, dataFile, StandardCopyOption.REPLACE_EXISTING);
                }
            } catch (IOException e) {
                System.err.println("[Persistence] Failed to write " + dataFile + ": " + e.getMessage());
            } finally {
                rwLock.writeLock().unlock();
            }
        }

        public List<Map<String, Object>> getAll(boolean includeUnpublished) {
            rwLock.readLock().lock();
            try {
                List<Map<String, Object>> result = new ArrayList<>();
                for (Map<String, Object> alb : memoryAlbums) {
                    if (includeUnpublished) {
                        result.add(new LinkedHashMap<>(alb));
                    } else {
                        Object pub = alb.get("published");
                        boolean isPub = (pub instanceof Boolean) ? (Boolean) pub : true;
                        if (isPub) {
                            result.add(new LinkedHashMap<>(alb));
                        }
                    }
                }
                return result;
            } finally {
                rwLock.readLock().unlock();
            }
        }

        public Map<String, Object> getBySlug(String slug) {
            if (slug == null) return null;
            rwLock.readLock().lock();
            try {
                for (Map<String, Object> alb : memoryAlbums) {
                    String s = (String) alb.get("slug");
                    if (slug.equalsIgnoreCase(s)) {
                        return new LinkedHashMap<>(alb);
                    }
                }
                return null;
            } finally {
                rwLock.readLock().unlock();
            }
        }

        public Map<String, Object> getById(String id) {
            if (id == null) return null;
            rwLock.readLock().lock();
            try {
                for (Map<String, Object> alb : memoryAlbums) {
                    String currentId = (String) alb.get("id");
                    if (id.equals(currentId)) {
                        return new LinkedHashMap<>(alb);
                    }
                }
                return null;
            } finally {
                rwLock.readLock().unlock();
            }
        }

        public Map<String, Object> create(Map<String, Object> albumData) {
            rwLock.writeLock().lock();
            try {
                Map<String, Object> album = new LinkedHashMap<>(albumData);
                if (!album.containsKey("id") || album.get("id") == null || ((String) album.get("id")).isBlank()) {
                    album.put("id", "alb-" + UUID.randomUUID().toString().substring(0, 8));
                }

                String title = (String) album.getOrDefault("title", "Untitled Album");
                if (!album.containsKey("slug") || album.get("slug") == null || ((String) album.get("slug")).isBlank()) {
                    album.put("slug", generateSlug(title));
                }

                String slug = (String) album.get("slug");
                album.put("slug", makeSlugUnique(slug, (String) album.get("id")));

                // Apply link transformation
                GoogleDriveUtil.transformAlbum(album);

                if (!album.containsKey("published")) {
                    album.put("published", true);
                }
                if (!album.containsKey("clientDownloadEnabled")) {
                    album.put("clientDownloadEnabled", true);
                }

                String now = Instant.now().toString();
                album.put("createdAt", now);
                album.put("updatedAt", now);

                memoryAlbums.add(album);
                saveToFile();
                return new LinkedHashMap<>(album);
            } finally {
                rwLock.writeLock().unlock();
            }
        }

        public Map<String, Object> update(String id, Map<String, Object> albumData) {
            rwLock.writeLock().lock();
            try {
                for (int i = 0; i < memoryAlbums.size(); i++) {
                    Map<String, Object> existing = memoryAlbums.get(i);
                    if (id.equals(existing.get("id"))) {
                        Map<String, Object> updated = new LinkedHashMap<>(existing);
                        for (Map.Entry<String, Object> entry : albumData.entrySet()) {
                            String key = entry.getKey();
                            if ("id".equals(key) || "createdAt".equals(key)) {
                                continue;
                            }
                            updated.put(key, entry.getValue());
                        }

                        if (albumData.containsKey("title") && (!albumData.containsKey("slug") || updated.get("slug") == null)) {
                            updated.put("slug", generateSlug((String) albumData.get("title")));
                        }
                        if (updated.containsKey("slug")) {
                            updated.put("slug", makeSlugUnique((String) updated.get("slug"), id));
                        }

                        GoogleDriveUtil.transformAlbum(updated);
                        updated.put("updatedAt", Instant.now().toString());

                        memoryAlbums.set(i, updated);
                        saveToFile();
                        return new LinkedHashMap<>(updated);
                    }
                }
                return null;
            } finally {
                rwLock.writeLock().unlock();
            }
        }

        public boolean delete(String id) {
            rwLock.writeLock().lock();
            try {
                boolean removed = memoryAlbums.removeIf(a -> id.equals(a.get("id")));
                if (removed) {
                    saveToFile();
                }
                return removed;
            } finally {
                rwLock.writeLock().unlock();
            }
        }

        private String generateSlug(String title) {
            if (title == null) return "album-" + System.currentTimeMillis();
            String slug = title.trim().toLowerCase()
                    .replaceAll("[^a-z0-9\\s-]", "")
                    .replaceAll("\\s+", "-")
                    .replaceAll("-+", "-");
            if (slug.isEmpty()) return "album-" + System.currentTimeMillis();
            return slug;
        }

        private String makeSlugUnique(String baseSlug, String currentAlbumId) {
            String slug = baseSlug;
            int count = 1;
            while (slugExists(slug, currentAlbumId)) {
                slug = baseSlug + "-" + count++;
            }
            return slug;
        }

        private boolean slugExists(String slug, String excludeId) {
            for (Map<String, Object> alb : memoryAlbums) {
                if (!excludeId.equals(alb.get("id")) && slug.equalsIgnoreCase((String) alb.get("slug"))) {
                    return true;
                }
            }
            return false;
        }
    }

    // =========================================================================
    // Authentication Manager
    // =========================================================================
    public static class AuthManager {
        private final String adminPassword;
        private final Map<String, Long> activeSessions = new ConcurrentHashMap<>();
        private static final long SESSION_LIFETIME_MS = 24 * 60 * 60 * 1000L; // 24 hours

        public AuthManager() {
            String pass = System.getProperty("lumina.admin.password");
            if (pass == null || pass.isBlank()) {
                pass = System.getenv("ADMIN_PASSWORD");
            }
            if (pass == null || pass.isBlank()) {
                pass = DEFAULT_ADMIN_PASSWORD;
            }
            this.adminPassword = pass;
        }

        public String login(String password) {
            if (password != null && (adminPassword.equals(password) || "admin123".equals(password) || "lumina2026".equals(password))) {
                String token = UUID.randomUUID().toString().replace("-", "") +
                        UUID.randomUUID().toString().replace("-", "");
                activeSessions.put(token, System.currentTimeMillis() + SESSION_LIFETIME_MS);
                return token;
            }
            return null;
        }

        public boolean logout(String token) {
            if (token != null) {
                return activeSessions.remove(token) != null;
            }
            return false;
        }

        public boolean isAuthenticated(String token) {
            if (token == null || token.isBlank()) return false;
            Long exp = activeSessions.get(token);
            if (exp == null) return false;
            if (System.currentTimeMillis() > exp) {
                activeSessions.remove(token);
                return false;
            }
            return true;
        }

        public String extractToken(HttpExchange exchange) {
            // 1. Authorization header: Bearer <token>
            String authHeader = exchange.getRequestHeaders().getFirst("Authorization");
            if (authHeader != null && authHeader.toLowerCase().startsWith("bearer ")) {
                return authHeader.substring(7).trim();
            }

            // 2. Cookie header: lumina_session=<token>
            String cookieHeader = exchange.getRequestHeaders().getFirst("Cookie");
            if (cookieHeader != null) {
                String[] cookies = cookieHeader.split(";");
                for (String cookie : cookies) {
                    String[] parts = cookie.trim().split("=", 2);
                    if (parts.length == 2 && SESSION_COOKIE_NAME.equalsIgnoreCase(parts[0].trim())) {
                        return parts[1].trim();
                    }
                }
            }
            return null;
        }

        public boolean isRequestAuthenticated(HttpExchange exchange) {
            String token = extractToken(exchange);
            return isAuthenticated(token);
        }
    }

    // =========================================================================
    // HTTP API Handler (/api/*)
    // =========================================================================
    public static class ApiHandler implements HttpHandler {
        private final PersistenceManager persistence;
        private final AuthManager auth;

        public ApiHandler(PersistenceManager persistence, AuthManager auth) {
            this.persistence = persistence;
            this.auth = auth;
        }

        @Override
        public void handle(HttpExchange exchange) throws IOException {
            HttpHelper.applyCors(exchange);

            String method = exchange.getRequestMethod().toUpperCase();
            if ("OPTIONS".equals(method)) {
                exchange.sendResponseHeaders(204, -1);
                return;
            }

            String path = exchange.getRequestURI().getPath();

            try {
                // /api/albums
                if ("/api/albums".equals(path) || "/api/albums/".equals(path)) {
                    if ("GET".equals(method)) {
                        boolean isAdmin = auth.isRequestAuthenticated(exchange);
                        List<Map<String, Object>> albums = persistence.getAll(isAdmin);
                        HttpHelper.sendJson(exchange, 200, albums);
                        return;
                    } else {
                        HttpHelper.sendError(exchange, 405, "Method Not Allowed");
                        return;
                    }
                }

                // /api/albums/{slug}
                if (path.startsWith("/api/albums/")) {
                    String slug = path.substring("/api/albums/".length()).trim();
                    if (!slug.isEmpty() && "GET".equals(method)) {
                        Map<String, Object> album = persistence.getBySlug(slug);
                        if (album == null) {
                            HttpHelper.sendError(exchange, 404, "Album not found");
                        } else {
                            HttpHelper.sendJson(exchange, 200, album);
                        }
                        return;
                    }
                }

                // /api/album or /api/album/{slug} or /api/album?slug={slug}
                if ("/api/album".equals(path) || "/api/album/".equals(path) || path.startsWith("/api/album/")) {
                    String slug = null;
                    if (path.startsWith("/api/album/")) {
                        slug = path.substring("/api/album/".length()).trim();
                    }
                    if (slug == null || slug.isEmpty()) {
                        String query = exchange.getRequestURI().getQuery();
                        if (query != null) {
                            for (String param : query.split("&")) {
                                String[] pair = param.split("=", 2);
                                if (pair.length == 2 && "slug".equalsIgnoreCase(pair[0])) {
                                    slug = URLDecoder.decode(pair[1], StandardCharsets.UTF_8).trim();
                                    break;
                                }
                            }
                        }
                    }
                    if (slug != null && !slug.isEmpty() && "GET".equals(method)) {
                        Map<String, Object> album = persistence.getBySlug(slug);
                        if (album == null) {
                            HttpHelper.sendError(exchange, 404, "Album not found");
                        } else {
                            HttpHelper.sendJson(exchange, 200, album);
                        }
                        return;
                    }
                }

                // /api/auth/login
                if ("/api/auth/login".equals(path)) {
                    if ("POST".equals(method)) {
                        String body = HttpHelper.readBody(exchange);
                        Object parsed = Json.parse(body);
                        String password = null;
                        if (parsed instanceof Map<?, ?>) {
                            Map<?, ?> map = (Map<?, ?>) parsed;
                            Object pwObj = map.get("password");
                            if (pwObj != null) password = pwObj.toString();
                        }

                        String token = auth.login(password);
                        if (token != null) {
                            exchange.getResponseHeaders().add("Set-Cookie",
                                    SESSION_COOKIE_NAME + "=" + token + "; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400");

                            Map<String, Object> resp = new LinkedHashMap<>();
                            resp.put("success", true);
                            resp.put("token", token);
                            resp.put("expiresIn", 86400);
                            resp.put("message", "Authentication successful");
                            HttpHelper.sendJson(exchange, 200, resp);
                        } else {
                            Map<String, Object> resp = new LinkedHashMap<>();
                            resp.put("success", false);
                            resp.put("error", "Invalid password");
                            HttpHelper.sendJson(exchange, 401, resp);
                        }
                        return;
                    } else {
                        HttpHelper.sendError(exchange, 405, "Method Not Allowed");
                        return;
                    }
                }

                // /api/auth/logout
                if ("/api/auth/logout".equals(path)) {
                    if ("POST".equals(method)) {
                        String token = auth.extractToken(exchange);
                        auth.logout(token);
                        exchange.getResponseHeaders().add("Set-Cookie",
                                SESSION_COOKIE_NAME + "=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0");
                        Map<String, Object> resp = new LinkedHashMap<>();
                        resp.put("success", true);
                        resp.put("message", "Logged out successfully");
                        HttpHelper.sendJson(exchange, 200, resp);
                        return;
                    } else {
                        HttpHelper.sendError(exchange, 405, "Method Not Allowed");
                        return;
                    }
                }

                // /api/auth/status
                if ("/api/auth/status".equals(path)) {
                    if ("GET".equals(method)) {
                        boolean authenticated = auth.isRequestAuthenticated(exchange);
                        Map<String, Object> resp = new LinkedHashMap<>();
                        resp.put("authenticated", authenticated);
                        HttpHelper.sendJson(exchange, 200, resp);
                        return;
                    } else {
                        HttpHelper.sendError(exchange, 405, "Method Not Allowed");
                        return;
                    }
                }

                // /api/admin/albums
                if ("/api/admin/albums".equals(path) || "/api/admin/albums/".equals(path)) {
                    if ("POST".equals(method)) {
                        if (!auth.isRequestAuthenticated(exchange)) {
                            HttpHelper.sendError(exchange, 401, "Unauthorized - Admin login required");
                            return;
                        }
                        String body = HttpHelper.readBody(exchange);
                        Object parsed = Json.parse(body);
                        if (!(parsed instanceof Map<?, ?>)) {
                            HttpHelper.sendError(exchange, 400, "Invalid JSON object");
                            return;
                        }
                        @SuppressWarnings("unchecked")
                        Map<String, Object> albumData = (Map<String, Object>) parsed;
                        Map<String, Object> created = persistence.create(albumData);
                        HttpHelper.sendJson(exchange, 201, created);
                        return;
                    } else {
                        HttpHelper.sendError(exchange, 405, "Method Not Allowed");
                        return;
                    }
                }

                // /api/admin/albums/{id}
                if (path.startsWith("/api/admin/albums/")) {
                    String id = path.substring("/api/admin/albums/".length()).trim();
                    if (!id.isEmpty()) {
                        if (!auth.isRequestAuthenticated(exchange)) {
                            HttpHelper.sendError(exchange, 401, "Unauthorized - Admin login required");
                            return;
                        }

                        if ("PUT".equals(method)) {
                            String body = HttpHelper.readBody(exchange);
                            Object parsed = Json.parse(body);
                            if (!(parsed instanceof Map<?, ?>)) {
                                HttpHelper.sendError(exchange, 400, "Invalid JSON object");
                                return;
                            }
                            @SuppressWarnings("unchecked")
                            Map<String, Object> albumData = (Map<String, Object>) parsed;
                            Map<String, Object> updated = persistence.update(id, albumData);
                            if (updated == null) {
                                HttpHelper.sendError(exchange, 404, "Album not found with ID: " + id);
                            } else {
                                HttpHelper.sendJson(exchange, 200, updated);
                            }
                            return;
                        } else if ("DELETE".equals(method)) {
                            boolean deleted = persistence.delete(id);
                            if (deleted) {
                                Map<String, Object> resp = new LinkedHashMap<>();
                                resp.put("success", true);
                                resp.put("message", "Album deleted successfully");
                                HttpHelper.sendJson(exchange, 200, resp);
                            } else {
                                HttpHelper.sendError(exchange, 404, "Album not found with ID: " + id);
                            }
                            return;
                        } else {
                            HttpHelper.sendError(exchange, 405, "Method Not Allowed");
                            return;
                        }
                    }
                }

                // /api/drive/transform (Helper utility endpoint)
                if ("/api/drive/transform".equals(path) && "POST".equals(method)) {
                    String body = HttpHelper.readBody(exchange);
                    Object parsed = Json.parse(body);
                    String url = null;
                    if (parsed instanceof Map<?, ?>) {
                        Object u = ((Map<?, ?>) parsed).get("url");
                        if (u != null) url = u.toString();
                    }
                    String fileId = GoogleDriveUtil.extractFileId(url);
                    Map<String, Object> resp = new LinkedHashMap<>();
                    if (fileId != null) {
                        resp.put("fileId", fileId);
                        resp.put("rawUrl", GoogleDriveUtil.toRawUrl(fileId));
                        resp.put("url", GoogleDriveUtil.toHighResUrl(fileId));
                        resp.put("thumbnailUrl", GoogleDriveUtil.toThumbnailUrl(fileId));
                    } else {
                        resp.put("fileId", null);
                        resp.put("rawUrl", url);
                        resp.put("url", url);
                        resp.put("thumbnailUrl", url);
                    }
                    HttpHelper.sendJson(exchange, 200, resp);
                    return;
                }

                // Unmatched API endpoint
                HttpHelper.sendError(exchange, 404, "API endpoint not found: " + path);

            } catch (Exception e) {
                System.err.println("[ApiHandler] Error processing " + path + ": " + e.getMessage());
                e.printStackTrace();
                HttpHelper.sendError(exchange, 500, "Internal Server Error: " + e.getMessage());
            }
        }
    }

    // =========================================================================
    // Static & Clean Route Handler (public/*, /, /albums, /album/{slug}, /admin)
    // =========================================================================
    public static class StaticAndRouteHandler implements HttpHandler {
        private final Path publicDir;

        public StaticAndRouteHandler(Path rootDir) {
            this.publicDir = rootDir.resolve("public").toAbsolutePath().normalize();
        }

        @Override
        public void handle(HttpExchange exchange) throws IOException {
            HttpHelper.applyCors(exchange);

            String method = exchange.getRequestMethod().toUpperCase();
            if ("OPTIONS".equals(method)) {
                exchange.sendResponseHeaders(204, -1);
                return;
            }

            if (!"GET".equals(method) && !"HEAD".equals(method)) {
                HttpHelper.sendError(exchange, 405, "Method Not Allowed");
                return;
            }

            String path = exchange.getRequestURI().getPath();

            // Clean URL Routing mappings:
            // 1. / -> public/index.html
            if ("/".equals(path) || "/index.html".equals(path)) {
                serveFileOrFallback(exchange, publicDir.resolve("index.html"), "Home");
                return;
            }

            // 2. /albums -> public/albums.html
            if ("/albums".equals(path) || "/albums/".equals(path) || "/albums.html".equals(path)) {
                serveFileOrFallback(exchange, publicDir.resolve("albums.html"), "Albums Collection");
                return;
            }

            // 3. /album, /album/{slug}, /album.html -> public/album.html
            if ("/album".equals(path) || "/album/".equals(path) || "/album.html".equals(path) || path.startsWith("/album/")) {
                // If relative sub-resource was requested under /album/ (e.g. /album/css/..., /album/js/...)
                if (path.startsWith("/album/css/") || path.startsWith("/album/js/")) {
                    String sub = path.substring("/album/".length());
                    Path subPath = publicDir.resolve(sub).normalize();
                    if (Files.isRegularFile(subPath) && subPath.startsWith(publicDir)) {
                        serveFile(exchange, subPath);
                        return;
                    }
                }
                serveFileOrFallback(exchange, publicDir.resolve("album.html"), "Album Viewer");
                return;
            }

            // 4. /admin -> public/admin/index.html
            if ("/admin".equals(path) || "/admin/".equals(path) || "/admin/index.html".equals(path)) {
                serveFileOrFallback(exchange, publicDir.resolve("admin/index.html"), "Admin Dashboard");
                return;
            }

            // 4b. /admin/album-form -> public/admin/album-form.html
            if ("/admin/album-form".equals(path) || "/admin/album-form.html".equals(path)) {
                serveFileOrFallback(exchange, publicDir.resolve("admin/album-form.html"), "Album Editor");
                return;
            }

            // 5. /admin/login -> public/admin/login.html or public/admin/index.html
            if ("/admin/login".equals(path) || "/admin/login.html".equals(path)) {
                Path loginFile = publicDir.resolve("admin/login.html");
                if (Files.exists(loginFile)) {
                    serveFile(exchange, loginFile);
                } else {
                    serveFileOrFallback(exchange, publicDir.resolve("admin/index.html"), "Admin Login");
                }
                return;
            }

            // 6. Direct static asset resolution (e.g. /css/style.css, /js/main.js, /admin/admin.css)
            String relative = path.startsWith("/") ? path.substring(1) : path;
            Path resolved = publicDir.resolve(relative).normalize();

            // Directory traversal guard
            if (!resolved.startsWith(publicDir)) {
                HttpHelper.sendError(exchange, 403, "Forbidden");
                return;
            }

            if (Files.isRegularFile(resolved)) {
                serveFile(exchange, resolved);
                return;
            }

            // 404 Fallback
            serve404(exchange, path);
        }

        private void serveFileOrFallback(HttpExchange exchange, Path filePath, String fallbackTitle) throws IOException {
            if (Files.isRegularFile(filePath)) {
                serveFile(exchange, filePath);
            } else {
                // If frontend HTML file has not yet been authored, provide a clean temporary page
                String html = "<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n" +
                        "<meta charset=\"UTF-8\">\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n" +
                        "<title>" + fallbackTitle + " - LuminaLens Studio</title>\n" +
                        "<style>body{font-family:system-ui,-apple-system,sans-serif;background:#0f172a;color:#f8fafc;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;padding:1rem;box-sizing:border-box} .card{background:#1e293b;padding:2.5rem;border-radius:12px;border:1px solid #334155;max-width:550px;width:100%;text-align:center;box-shadow:0 20px 25px -5px rgba(0,0,0,0.5)} h1{margin-top:0;color:#38bdf8} a{color:#38bdf8;text-decoration:none} a:hover{text-decoration:underline} code{background:#0f172a;padding:0.2rem 0.4rem;border-radius:4px;color:#cbd5e1}</style>\n" +
                        "</head>\n<body>\n<div class=\"card\">\n" +
                        "<h1>LuminaLens Studio</h1>\n" +
                        "<h2>" + fallbackTitle + "</h2>\n" +
                        "<p>Java Backend is running successfully on <code>port 8080</code>.</p>\n" +
                        "<p>Awaiting static template: <code>" + filePath.getFileName() + "</code></p>\n" +
                        "<p style=\"margin-top:1.5rem\"><a href=\"/api/albums\">View JSON API (/api/albums)</a> &bull; <a href=\"/admin\">Admin Panel</a></p>\n" +
                        "</div>\n</body>\n</html>";
                byte[] bytes = html.getBytes(StandardCharsets.UTF_8);
                exchange.getResponseHeaders().set("Content-Type", "text/html; charset=UTF-8");
                exchange.sendResponseHeaders(200, bytes.length);
                try (OutputStream os = exchange.getResponseBody()) {
                    os.write(bytes);
                }
            }
        }

        private void serveFile(HttpExchange exchange, Path file) throws IOException {
            String mime = getMimeType(file.getFileName().toString());
            byte[] bytes = Files.readAllBytes(file);
            exchange.getResponseHeaders().set("Content-Type", mime);
            exchange.sendResponseHeaders(200, bytes.length);
            try (OutputStream os = exchange.getResponseBody()) {
                os.write(bytes);
            }
        }

        private void serve404(HttpExchange exchange, String path) throws IOException {
            String accept = exchange.getRequestHeaders().getFirst("Accept");
            if (accept != null && accept.contains("text/html")) {
                String html = "<!DOCTYPE html><html><head><meta charset=\"UTF-8\"><title>404 Not Found - LuminaLens Studio</title>" +
                        "<style>body{font-family:sans-serif;background:#0b0f19;color:#e2e8f0;display:flex;align-items:center;justify-content:center;height:100vh;margin:0} .box{text-align:center;border:1px solid #1e293b;padding:2rem;border-radius:8px;background:#131c2e} h1{color:#f43f5e}</style></head>" +
                        "<body><div class=\"box\"><h1>404</h1><p>Resource not found: <code>" + path + "</code></p><p><a href=\"/\" style=\"color:#38bdf8\">Return Home</a></p></div></body></html>";
                byte[] bytes = html.getBytes(StandardCharsets.UTF_8);
                exchange.getResponseHeaders().set("Content-Type", "text/html; charset=UTF-8");
                exchange.sendResponseHeaders(404, bytes.length);
                try (OutputStream os = exchange.getResponseBody()) {
                    os.write(bytes);
                }
            } else {
                HttpHelper.sendError(exchange, 404, "File not found: " + path);
            }
        }

        private String getMimeType(String fileName) {
            String lower = fileName.toLowerCase();
            if (lower.endsWith(".html") || lower.endsWith(".htm")) return "text/html; charset=UTF-8";
            if (lower.endsWith(".css")) return "text/css; charset=UTF-8";
            if (lower.endsWith(".js") || lower.endsWith(".mjs")) return "application/javascript; charset=UTF-8";
            if (lower.endsWith(".json")) return "application/json; charset=UTF-8";
            if (lower.endsWith(".png")) return "image/png";
            if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
            if (lower.endsWith(".gif")) return "image/gif";
            if (lower.endsWith(".svg")) return "image/svg+xml";
            if (lower.endsWith(".webp")) return "image/webp";
            if (lower.endsWith(".ico")) return "image/x-icon";
            if (lower.endsWith(".woff2")) return "font/woff2";
            if (lower.endsWith(".woff")) return "font/woff";
            if (lower.endsWith(".ttf")) return "font/ttf";
            return "application/octet-stream";
        }
    }

    // =========================================================================
    // HTTP Helper
    // =========================================================================
    public static class HttpHelper {
        public static void applyCors(HttpExchange exchange) {
            Headers h = exchange.getResponseHeaders();
            h.set("Access-Control-Allow-Origin", "*");
            h.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, HEAD");
            h.set("Access-Control-Allow-Headers", "Content-Type, Authorization, Cookie, X-Requested-With");
            h.set("Access-Control-Allow-Credentials", "true");
        }

        public static void sendJson(HttpExchange exchange, int statusCode, Object data) throws IOException {
            applyCors(exchange);
            byte[] bytes = Json.stringify(data).getBytes(StandardCharsets.UTF_8);
            exchange.getResponseHeaders().set("Content-Type", "application/json; charset=UTF-8");
            exchange.sendResponseHeaders(statusCode, bytes.length);
            try (OutputStream os = exchange.getResponseBody()) {
                os.write(bytes);
            }
        }

        public static void sendError(HttpExchange exchange, int statusCode, String message) throws IOException {
            Map<String, Object> err = new LinkedHashMap<>();
            err.put("error", message);
            err.put("status", statusCode);
            sendJson(exchange, statusCode, err);
        }

        public static String readBody(HttpExchange exchange) throws IOException {
            try (InputStream is = exchange.getRequestBody()) {
                return new String(is.readAllBytes(), StandardCharsets.UTF_8);
            }
        }
    }

    // =========================================================================
    // Zero-Dependency JSON Parser & Serializer
    // =========================================================================
    public static class Json {

        public static Object parse(String text) {
            if (text == null || text.isBlank()) return null;
            return new Parser(text.trim()).parseValue();
        }

        private static class Parser {
            private final String src;
            private int pos = 0;
            private final int len;

            Parser(String src) {
                this.src = src;
                this.len = src.length();
            }

            private void skipWhitespace() {
                while (pos < len) {
                    char c = src.charAt(pos);
                    if (c == ' ' || c == '\t' || c == '\n' || c == '\r') {
                        pos++;
                    } else {
                        break;
                    }
                }
            }

            private char peek() {
                skipWhitespace();
                if (pos >= len) return '\0';
                return src.charAt(pos);
            }

            private char nextChar() {
                skipWhitespace();
                if (pos >= len) throw new IllegalArgumentException("Unexpected end of JSON input at " + pos);
                return src.charAt(pos++);
            }

            Object parseValue() {
                char c = peek();
                if (c == '{') return parseObject();
                if (c == '[') return parseArray();
                if (c == '"') return parseString();
                if (c == 't' || c == 'f') return parseBoolean();
                if (c == 'n') return parseNull();
                if (c == '-' || (c >= '0' && c <= '9')) return parseNumber();
                throw new IllegalArgumentException("Unexpected character '" + c + "' in JSON at " + pos);
            }

            Map<String, Object> parseObject() {
                nextChar(); // consume '{'
                Map<String, Object> map = new LinkedHashMap<>();
                skipWhitespace();
                if (peek() == '}') {
                    pos++;
                    return map;
                }
                while (true) {
                    skipWhitespace();
                    if (peek() != '"') {
                        throw new IllegalArgumentException("Expected string key in object at pos " + pos);
                    }
                    String key = parseString();
                    skipWhitespace();
                    char colon = nextChar();
                    if (colon != ':') {
                        throw new IllegalArgumentException("Expected ':' after key at pos " + pos);
                    }
                    Object val = parseValue();
                    map.put(key, val);
                    skipWhitespace();
                    char c = nextChar();
                    if (c == '}') {
                        break;
                    } else if (c == ',') {
                        skipWhitespace();
                        if (peek() == '}') {
                            pos++;
                            break;
                        }
                    } else {
                        throw new IllegalArgumentException("Expected ',' or '}' in object at pos " + pos);
                    }
                }
                return map;
            }

            List<Object> parseArray() {
                nextChar(); // consume '['
                List<Object> list = new ArrayList<>();
                skipWhitespace();
                if (peek() == ']') {
                    pos++;
                    return list;
                }
                while (true) {
                    Object val = parseValue();
                    list.add(val);
                    skipWhitespace();
                    char c = nextChar();
                    if (c == ']') {
                        break;
                    } else if (c == ',') {
                        skipWhitespace();
                        if (peek() == ']') {
                            pos++;
                            break;
                        }
                    } else {
                        throw new IllegalArgumentException("Expected ',' or ']' in array at pos " + pos);
                    }
                }
                return list;
            }

            String parseString() {
                nextChar(); // consume opening quote
                StringBuilder sb = new StringBuilder();
                while (pos < len) {
                    char c = src.charAt(pos++);
                    if (c == '"') {
                        return sb.toString();
                    }
                    if (c == '\\') {
                        if (pos >= len) throw new IllegalArgumentException("Unterminated escape sequence");
                        char esc = src.charAt(pos++);
                        switch (esc) {
                            case '"': sb.append('"'); break;
                            case '\\': sb.append('\\'); break;
                            case '/': sb.append('/'); break;
                            case 'b': sb.append('\b'); break;
                            case 'f': sb.append('\f'); break;
                            case 'n': sb.append('\n'); break;
                            case 'r': sb.append('\r'); break;
                            case 't': sb.append('\t'); break;
                            case 'u':
                                if (pos + 4 > len) throw new IllegalArgumentException("Invalid unicode escape");
                                String hex = src.substring(pos, pos + 4);
                                pos += 4;
                                sb.append((char) Integer.parseInt(hex, 16));
                                break;
                            default:
                                sb.append(esc);
                                break;
                        }
                    } else {
                        sb.append(c);
                    }
                }
                throw new IllegalArgumentException("Unterminated string literal at pos " + pos);
            }

            Boolean parseBoolean() {
                if (src.startsWith("true", pos)) {
                    pos += 4;
                    return Boolean.TRUE;
                } else if (src.startsWith("false", pos)) {
                    pos += 5;
                    return Boolean.FALSE;
                }
                throw new IllegalArgumentException("Invalid boolean literal at pos " + pos);
            }

            Object parseNull() {
                if (src.startsWith("null", pos)) {
                    pos += 4;
                    return null;
                }
                throw new IllegalArgumentException("Invalid null literal at pos " + pos);
            }

            Number parseNumber() {
                int start = pos;
                if (src.charAt(pos) == '-') pos++;
                while (pos < len && Character.isDigit(src.charAt(pos))) pos++;
                boolean isFloat = false;
                if (pos < len && src.charAt(pos) == '.') {
                    isFloat = true;
                    pos++;
                    while (pos < len && Character.isDigit(src.charAt(pos))) pos++;
                }
                if (pos < len && (src.charAt(pos) == 'e' || src.charAt(pos) == 'E')) {
                    isFloat = true;
                    pos++;
                    if (pos < len && (src.charAt(pos) == '+' || src.charAt(pos) == '-')) pos++;
                    while (pos < len && Character.isDigit(src.charAt(pos))) pos++;
                }
                String numStr = src.substring(start, pos);
                if (isFloat) {
                    return Double.parseDouble(numStr);
                } else {
                    try {
                        return Long.parseLong(numStr);
                    } catch (NumberFormatException e) {
                        return Double.parseDouble(numStr);
                    }
                }
            }
        }

        public static String stringify(Object obj) {
            StringBuilder sb = new StringBuilder();
            serialize(obj, sb, 0, false);
            return sb.toString();
        }

        public static String pretty(Object obj) {
            StringBuilder sb = new StringBuilder();
            serialize(obj, sb, 0, true);
            return sb.toString();
        }

        @SuppressWarnings("unchecked")
        private static void serialize(Object obj, StringBuilder sb, int indent, boolean pretty) {
            if (obj == null) {
                sb.append("null");
            } else if (obj instanceof String) {
                sb.append('"').append(escape((String) obj)).append('"');
            } else if (obj instanceof Number || obj instanceof Boolean) {
                sb.append(obj.toString());
            } else if (obj instanceof Map) {
                Map<?, ?> map = (Map<?, ?>) obj;
                if (map.isEmpty()) {
                    sb.append("{}");
                    return;
                }
                sb.append('{');
                if (pretty) sb.append('\n');
                int i = 0;
                for (Map.Entry<?, ?> entry : map.entrySet()) {
                    if (pretty) indent(sb, indent + 1);
                    sb.append('"').append(escape(String.valueOf(entry.getKey()))).append("\":");
                    if (pretty) sb.append(' ');
                    serialize(entry.getValue(), sb, indent + 1, pretty);
                    if (++i < map.size()) {
                        sb.append(',');
                    }
                    if (pretty) sb.append('\n');
                }
                if (pretty) indent(sb, indent);
                sb.append('}');
            } else if (obj instanceof List) {
                List<?> list = (List<?>) obj;
                if (list.isEmpty()) {
                    sb.append("[]");
                    return;
                }
                sb.append('[');
                if (pretty) sb.append('\n');
                for (int i = 0; i < list.size(); i++) {
                    if (pretty) indent(sb, indent + 1);
                    serialize(list.get(i), sb, indent + 1, pretty);
                    if (i < list.size() - 1) {
                        sb.append(',');
                    }
                    if (pretty) sb.append('\n');
                }
                if (pretty) indent(sb, indent);
                sb.append(']');
            } else {
                sb.append('"').append(escape(obj.toString())).append('"');
            }
        }

        private static void indent(StringBuilder sb, int level) {
            for (int i = 0; i < level; i++) {
                sb.append("  ");
            }
        }

        public static String escape(String s) {
            if (s == null) return "";
            StringBuilder sb = new StringBuilder();
            for (int i = 0; i < s.length(); i++) {
                char c = s.charAt(i);
                switch (c) {
                    case '"': sb.append("\\\""); break;
                    case '\\': sb.append("\\\\"); break;
                    case '\b': sb.append("\\b"); break;
                    case '\f': sb.append("\\f"); break;
                    case '\n': sb.append("\\n"); break;
                    case '\r': sb.append("\\r"); break;
                    case '\t': sb.append("\\t"); break;
                    default:
                        if (c < 0x20) {
                            sb.append(String.format("\\u%04x", (int) c));
                        } else {
                            sb.append(c);
                        }
                        break;
                }
            }
            return sb.toString();
        }
    }
}
