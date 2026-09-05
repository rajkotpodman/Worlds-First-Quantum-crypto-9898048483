package ai.secure.space;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Bundle;
import android.os.Build;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebChromeClient;
import android.webkit.PermissionRequest;
import android.webkit.GeolocationPermissions;
import android.webkit.JavascriptInterface;
import android.widget.Toast;
import android.annotation.TargetApi;
import android.graphics.Color;
import android.net.Uri;
import android.net.http.SslError;
import android.util.Log;
import android.view.View;
import android.webkit.ConsoleMessage;
import android.webkit.SslErrorHandler;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;

import java.io.*;
import java.net.*;
import java.util.*;
import java.util.concurrent.*;

public class MainActivity extends Activity {
    private static final int PERMISSION_REQUEST_CODE = 4201;
    private WebView mWebView;
    private LocalMicroServer mServer;
    private int mServerPort = 8080;
    public volatile boolean mFilesExtracted = false;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        requestWindowFeature(Window.FEATURE_NO_TITLE);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            Window window = getWindow();
            window.addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);
            window.setStatusBarColor(Color.parseColor("#020617"));
            window.setNavigationBarColor(Color.parseColor("#020617"));
        }

        // Initialize WebView and render instantly so UI is active on screen without waiting
        initWebView();

        startAutoStartService();
        startLocalServer();
        extractOfflineBundleFilesAsync();

        // Prompt permissions smoothly after UI is rendered so dialogs do not block initial paint
        if (mWebView != null) {
            mWebView.postDelayed(new Runnable() {
                @Override
                public void run() {
                    autoRequestPermissions();
                }
            }, 1200);
        }
    }

    private void startAutoStartService() {
        try {
            Intent serviceIntent = new Intent(this, AutonomousSecurityService.class);
            serviceIntent.setAction(AutonomousSecurityService.ACTION_AUTO_START);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                startForegroundService(serviceIntent);
            } else {
                startService(serviceIntent);
            }
        } catch (Exception ignored) {}
    }

    private void autoRequestPermissions() {
        if (Build.VERSION.SDK_INT >= 23) {
            List<String> permissions = new ArrayList<String>();
            permissions.add("android.permission.CAMERA");
            permissions.add("android.permission.RECORD_AUDIO");
            permissions.add("android.permission.ACCESS_FINE_LOCATION");
            permissions.add("android.permission.ACCESS_COARSE_LOCATION");
            permissions.add("android.permission.READ_EXTERNAL_STORAGE");
            permissions.add("android.permission.WRITE_EXTERNAL_STORAGE");
            permissions.add("android.permission.USE_BIOMETRIC");
            permissions.add("android.permission.USE_FINGERPRINT");
            permissions.add("android.permission.VIBRATE");
            permissions.add("android.permission.WAKE_LOCK");
            if (Build.VERSION.SDK_INT >= 33) {
                permissions.add("android.permission.POST_NOTIFICATIONS");
            }
            if (Build.VERSION.SDK_INT >= 31) {
                permissions.add("android.permission.BLUETOOTH_CONNECT");
                permissions.add("android.permission.BLUETOOTH_SCAN");
            }

            List<String> needed = new ArrayList<String>();
            for (String perm : permissions) {
                if (checkSelfPermission(perm) != PackageManager.PERMISSION_GRANTED) {
                    needed.add(perm);
                }
            }

            if (!needed.isEmpty()) {
                requestPermissions(needed.toArray(new String[0]), PERMISSION_REQUEST_CODE);
            }
        }
    }

    private void startLocalServer() {
        try {
            mServer = new LocalMicroServer(this, 8080);
            mServer.start();
            mServerPort = mServer.getPort();
        } catch (Exception e) {
            mServerPort = 8080;
        }
    }

    private void extractOfflineBundleFilesAsync() {
        new Thread(new Runnable() {
            @Override
            public void run() {
                try {
                    File targetDir = new File(getFilesDir(), "ai_secure_space");
                    if (!targetDir.exists()) {
                        targetDir.mkdirs();
                    }
                    extractAssetFolder("models", new File(targetDir, "models"));
                    extractAssetFolder("zk", new File(targetDir, "zk"));
                    extractAssetFolder("data", new File(targetDir, "data"));
                    mFilesExtracted = true;
                } catch (Exception ignored) {}
            }
        }, "OfflineBundleExtractor").start();
    }

    private void extractAssetFolder(String srcAssetPath, File destDir) {
        try {
            String[] list = getAssets().list(srcAssetPath);
            if (list == null || list.length == 0) {
                copySingleAsset(srcAssetPath, destDir);
            } else {
                if (!destDir.exists()) destDir.mkdirs();
                for (String item : list) {
                    String subSrc = srcAssetPath + "/" + item;
                    File subDest = new File(destDir, item);
                    String[] subList = getAssets().list(subSrc);
                    if (subList != null && subList.length > 0) {
                        extractAssetFolder(subSrc, subDest);
                    } else {
                        copySingleAsset(subSrc, subDest);
                    }
                }
            }
        } catch (Exception ignored) {}
    }

    private void copySingleAsset(String assetPath, File destFile) {
        InputStream in = null;
        OutputStream out = null;
        try {
            if (destFile.exists() && destFile.length() > 0) return;
            if (destFile.getParentFile() != null && !destFile.getParentFile().exists()) {
                destFile.getParentFile().mkdirs();
            }
            in = getAssets().open(assetPath);
            out = new FileOutputStream(destFile);
            byte[] buf = new byte[65536];
            int len;
            while ((len = in.read(buf)) > 0) {
                out.write(buf, 0, len);
            }
        } catch (Exception ignored) {
        } finally {
            try { if (in != null) in.close(); } catch (Exception ignored) {}
            try { if (out != null) out.close(); } catch (Exception ignored) {}
        }
    }

    private void initWebView() {
        mWebView = new WebView(this);
        mWebView.setBackgroundColor(Color.parseColor("#020617"));

        // CRITICAL FIX FOR EMULATORS: Force software rendering layer to avoid virtual GPU/DirectX/ANGLE texture compositing black screen
        try {
            mWebView.setLayerType(View.LAYER_TYPE_SOFTWARE, null);
        } catch (Exception ignored) {}

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
            WebView.setWebContentsDebuggingEnabled(true);
        }

        WebSettings settings = mWebView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setAllowFileAccessFromFileURLs(true);
        settings.setAllowUniversalAccessFromFileURLs(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setLoadWithOverviewMode(true);
        settings.setUseWideViewPort(true);
        settings.setGeolocationEnabled(true);
        settings.setJavaScriptCanOpenWindowsAutomatically(true);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
        }

        mWebView.setWebViewClient(new WebViewClient() {
            @TargetApi(Build.VERSION_CODES.N)
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                if (request != null && request.getUrl() != null) {
                    String url = request.getUrl().toString();
                    if (url.startsWith("https://localhost") || url.startsWith("http://127.0.0.1") || url.startsWith("http://localhost")) {
                        return false;
                    }
                }
                return false;
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                if (url.startsWith("https://localhost") || url.startsWith("http://127.0.0.1") || url.startsWith("http://localhost")) {
                    return false;
                }
                view.loadUrl(url);
                return true;
            }

            @TargetApi(Build.VERSION_CODES.LOLLIPOP)
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                if (request != null && request.getUrl() != null) {
                    WebResourceResponse res = handleAssetOrApiResponse(request.getUrl());
                    if (res != null) return res;
                }
                return super.shouldInterceptRequest(view, request);
            }

            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, String url) {
                if (url != null) {
                    WebResourceResponse res = handleAssetOrApiResponse(Uri.parse(url));
                    if (res != null) return res;
                }
                return super.shouldInterceptRequest(view, url);
            }

            @Override
            public void onReceivedSslError(WebView view, SslErrorHandler handler, SslError error) {
                Log.w("AISecureSpace_Web", "Bypassing SSL error for in-process origin: " + (error != null ? error.getUrl() : ""));
                if (handler != null) {
                    handler.proceed();
                }
            }

            @TargetApi(Build.VERSION_CODES.M)
            @Override
            public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                if (request != null && request.getUrl() != null) {
                    Log.e("AISecureSpace_Web", "WebView Error on " + request.getUrl() + ": " + (error != null ? error.getDescription() : "unknown"));
                }
            }

            @Override
            public void onReceivedError(WebView view, int errorCode, String description, String failingUrl) {
                Log.e("AISecureSpace_Web", "WebView Error [" + errorCode + "] " + description + " on " + failingUrl);
            }
        });

        mWebView.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onConsoleMessage(ConsoleMessage consoleMessage) {
                if (consoleMessage != null) {
                    Log.d("WebConsole", "[" + consoleMessage.messageLevel() + "] " + consoleMessage.message()
                            + " (" + consoleMessage.sourceId() + ":" + consoleMessage.lineNumber() + ")");
                }
                return true;
            }

            @Override
            public void onPermissionRequest(final PermissionRequest request) {
                runOnUiThread(new Runnable() {
                    @Override
                    public void run() {
                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                            request.grant(request.getResources());
                        }
                    }
                });
            }

            @Override
            public void onGeolocationPermissionsShowPrompt(String origin, GeolocationPermissions.Callback callback) {
                callback.invoke(origin, true, false);
            }
        });

        mWebView.addJavascriptInterface(new SecureSpaceNativeBridge(this), "AndroidNativeBridge");

        setContentView(mWebView);

        // Read dist/index.html directly from APK assets to inject into memory with zero network delay
        String htmlContent = null;
        try {
            InputStream is = getAssets().open("dist/index.html");
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            byte[] buf = new byte[8192];
            int len;
            while ((len = is.read(buf)) != -1) {
                baos.write(buf, 0, len);
            }
            is.close();
            htmlContent = baos.toString("UTF-8");
        } catch (Exception e) {
            Log.e("AISecureSpace", "Failed to read dist/index.html from assets: " + e.getMessage());
        }

        if (htmlContent != null && !htmlContent.isEmpty()) {
            Log.i("AISecureSpace", "Rendering index.html via loadDataWithBaseURL (" + htmlContent.length() + " bytes)");
            mWebView.loadDataWithBaseURL("https://localhost/", htmlContent, "text/html", "UTF-8", "https://localhost/index.html");
        } else {
            Log.i("AISecureSpace", "Falling back to loadUrl");
            mWebView.loadUrl("https://localhost/index.html");
        }
    }

    private WebResourceResponse handleAssetOrApiResponse(Uri uri) {
        if (uri == null) return null;
        String host = uri.getHost();
        if (host == null) host = "";

        boolean isLocalOrigin = host.equals("localhost") || host.equals("127.0.0.1") || host.contains("secure.space") || host.isEmpty();
        if (!isLocalOrigin) {
            return null;
        }

        String rawPath = uri.getPath();
        if (rawPath == null || rawPath.isEmpty() || rawPath.equals("/")) {
            rawPath = "/index.html";
        }

        // 1. In-process API endpoints
        if (rawPath.equals("/api/health") || rawPath.equals("/api/ping")) {
            String json = "{\"status\":\"ok\",\"server\":\"InProcessNativeBridge\",\"port\":" + mServerPort + ",\"timestamp\":" + System.currentTimeMillis() + "}";
            return createJsonResponse(json);
        }
        if (rawPath.equals("/api/system/status")) {
            String json = "{\"online\":true,\"engine\":\"Native-Dalvik-InProcess\",\"offlineReady\":true,\"storage\":\"internal\",\"autoStart\":true,\"filesExtracted\":" + mFilesExtracted + "}";
            return createJsonResponse(json);
        }
        if (rawPath.equals("/api/device")) {
            String json = "{\"model\":\"" + Build.MODEL + "\",\"manufacturer\":\"" + Build.MANUFACTURER + "\",\"sdk\":" + Build.VERSION.SDK_INT + "}";
            return createJsonResponse(json);
        }

        // 2. Offline assets from APK
        String cleanPath = rawPath.startsWith("/") ? rawPath.substring(1) : rawPath;
        InputStream is = null;
        String finalMimeType = getMimeType(cleanPath);

        // Try dist/cleanPath first (where compiled web assets reside)
        try {
            is = getAssets().open("dist/" + cleanPath);
        } catch (Exception e1) {
            // Try cleanPath directly (models, zk, data)
            try {
                is = getAssets().open(cleanPath);
            } catch (Exception e2) {
                // If SPA route (e.g. /dashboard or /terminal) or not found, fallback to dist/index.html
                if (!cleanPath.contains(".")) {
                    try {
                        is = getAssets().open("dist/index.html");
                        finalMimeType = "text/html; charset=utf-8";
                    } catch (Exception ignored) {}
                }
            }
        }

        if (is != null) {
            WebResourceResponse resp = new WebResourceResponse(finalMimeType, "UTF-8", is);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                Map<String, String> headers = new HashMap<String, String>();
                headers.put("Access-Control-Allow-Origin", "*");
                headers.put("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE");
                headers.put("Access-Control-Allow-Headers", "*");
                headers.put("Cache-Control", "no-cache");
                resp.setResponseHeaders(headers);
            }
            return resp;
        }

        return null;
    }

    private WebResourceResponse createJsonResponse(String json) {
        try {
            byte[] bytes = json.getBytes("UTF-8");
            ByteArrayInputStream stream = new ByteArrayInputStream(bytes);
            WebResourceResponse resp = new WebResourceResponse("application/json; charset=utf-8", "UTF-8", stream);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                Map<String, String> headers = new HashMap<String, String>();
                headers.put("Access-Control-Allow-Origin", "*");
                headers.put("Content-Length", String.valueOf(bytes.length));
                resp.setResponseHeaders(headers);
            }
            return resp;
        } catch (Exception e) {
            return null;
        }
    }

    public static String getMimeType(String path) {
        String lower = path.toLowerCase();
        if (lower.endsWith(".html") || lower.endsWith(".htm")) return "text/html; charset=utf-8";
        if (lower.endsWith(".js") || lower.endsWith(".mjs")) return "application/javascript; charset=utf-8";
        if (lower.endsWith(".css")) return "text/css; charset=utf-8";
        if (lower.endsWith(".json")) return "application/json; charset=utf-8";
        if (lower.endsWith(".wasm")) return "application/wasm";
        if (lower.endsWith(".png")) return "image/png";
        if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
        if (lower.endsWith(".svg")) return "image/svg+xml";
        if (lower.endsWith(".ico")) return "image/x-icon";
        if (lower.endsWith(".woff2")) return "font/woff2";
        if (lower.endsWith(".woff")) return "font/woff";
        if (lower.endsWith(".ttf")) return "font/ttf";
        return "application/octet-stream";
    }

    @Override
    public void onBackPressed() {
        if (mWebView != null && mWebView.canGoBack()) {
            mWebView.goBack();
        } else {
            super.onBackPressed();
        }
    }

    @Override
    protected void onDestroy() {
        if (mServer != null) {
            mServer.stop();
        }
        super.onDestroy();
    }

    public static class LocalMicroServer {
        private final Context mContext;
        private int mPort;
        private ServerSocket mServerSocket;
        private boolean mRunning = false;
        private final ExecutorService mThreadPool = Executors.newFixedThreadPool(8);

        public LocalMicroServer(Context context, int preferredPort) {
            this.mContext = context;
            this.mPort = preferredPort;
        }

        public int getPort() { return mPort; }

        public void start() {
            try {
                try {
                    mServerSocket = new ServerSocket(mPort, 50, InetAddress.getByName("127.0.0.1"));
                } catch (Exception portErr) {
                    mServerSocket = new ServerSocket(0, 50, InetAddress.getByName("127.0.0.1"));
                    mPort = mServerSocket.getLocalPort();
                }
                mRunning = true;
                new Thread(new Runnable() {
                    @Override
                    public void run() {
                        while (mRunning && mServerSocket != null && !mServerSocket.isClosed()) {
                            try {
                                final Socket client = mServerSocket.accept();
                                mThreadPool.execute(new Runnable() {
                                    @Override
                                    public void run() {
                                        handleClient(client);
                                    }
                                });
                            } catch (Exception ignored) {}
                        }
                    }
                }, "LocalMicroServer-Worker").start();
            } catch (Exception ignored) {}
        }

        public void stop() {
            mRunning = false;
            try { if (mServerSocket != null) mServerSocket.close(); } catch (Exception ignored) {}
            mThreadPool.shutdownNow();
        }

        private void handleClient(Socket socket) {
            InputStream in = null;
            OutputStream out = null;
            try {
                socket.setSoTimeout(15000);
                in = socket.getInputStream();
                out = socket.getOutputStream();
                BufferedReader reader = new BufferedReader(new InputStreamReader(in, "UTF-8"));

                String requestLine = reader.readLine();
                if (requestLine == null || requestLine.isEmpty()) return;

                String[] parts = requestLine.split(" ");
                if (parts.length < 2) return;

                String method = parts[0];
                String rawPath = parts[1];
                int queryIdx = rawPath.indexOf('?');
                String path = queryIdx >= 0 ? rawPath.substring(0, queryIdx) : rawPath;

                if (method.equalsIgnoreCase("OPTIONS")) {
                    sendCorsResponse(out, 204, "No Content", "text/plain", new byte[0]);
                    return;
                }

                if (path.equals("/api/health") || path.equals("/api/ping")) {
                    String json = "{\"status\":\"ok\",\"server\":\"LocalAndroidMicroServer\",\"port\":" + mPort + ",\"timestamp\":" + System.currentTimeMillis() + "}";
                    sendCorsResponse(out, 200, "OK", "application/json; charset=utf-8", json.getBytes("UTF-8"));
                    return;
                }

                if (path.equals("/api/system/status")) {
                    String json = "{\"online\":true,\"engine\":\"Native-Dalvik-MicroDaemon\",\"offlineReady\":true,\"storage\":\"internal\",\"autoStart\":true}";
                    sendCorsResponse(out, 200, "OK", "application/json; charset=utf-8", json.getBytes("UTF-8"));
                    return;
                }

                if (path.equals("/api/device")) {
                    String json = "{\"model\":\"" + Build.MODEL + "\",\"manufacturer\":\"" + Build.MANUFACTURER + "\",\"sdk\":" + Build.VERSION.SDK_INT + "}";
                    sendCorsResponse(out, 200, "OK", "application/json; charset=utf-8", json.getBytes("UTF-8"));
                    return;
                }

                if (path.equals("/") || path.isEmpty()) {
                    path = "/index.html";
                }
                String assetPath = "dist" + path;
                InputStream assetStream = null;
                try {
                    assetStream = mContext.getAssets().open(assetPath);
                } catch (Exception notInDist) {
                    try {
                        assetStream = mContext.getAssets().open(path.startsWith("/") ? path.substring(1) : path);
                    } catch (Exception notInRoot) {
                        try {
                            assetStream = mContext.getAssets().open("dist/index.html");
                            path = "/index.html";
                        } catch (Exception notFound) {
                            sendCorsResponse(out, 404, "Not Found", "text/plain", "Asset Not Found".getBytes("UTF-8"));
                            return;
                        }
                    }
                }

                String contentType = getMimeType(path);
                sendStreamResponse(out, 200, "OK", contentType, assetStream);

            } catch (Exception ignored) {
            } finally {
                try { socket.close(); } catch (Exception ignored) {}
            }
        }

        private void sendCorsResponse(OutputStream out, int statusCode, String statusText, String contentType, byte[] data) throws IOException {
            PrintWriter pw = new PrintWriter(new OutputStreamWriter(out, "UTF-8"));
            pw.print("HTTP/1.1 " + statusCode + " " + statusText + "\r\n");
            pw.print("Content-Type: " + contentType + "\r\n");
            pw.print("Content-Length: " + data.length + "\r\n");
            pw.print("Access-Control-Allow-Origin: *\r\n");
            pw.print("Access-Control-Allow-Methods: GET, POST, OPTIONS, PUT, DELETE\r\n");
            pw.print("Access-Control-Allow-Headers: *\r\n");
            pw.print("Connection: close\r\n\r\n");
            pw.flush();
            if (data.length > 0) {
                out.write(data);
                out.flush();
            }
        }

        private void sendStreamResponse(OutputStream out, int statusCode, String statusText, String contentType, InputStream stream) throws IOException {
            PrintWriter pw = new PrintWriter(new OutputStreamWriter(out, "UTF-8"));
            pw.print("HTTP/1.1 " + statusCode + " " + statusText + "\r\n");
            pw.print("Content-Type: " + contentType + "\r\n");
            pw.print("Access-Control-Allow-Origin: *\r\n");
            pw.print("Access-Control-Allow-Methods: GET, POST, OPTIONS, PUT, DELETE\r\n");
            pw.print("Access-Control-Allow-Headers: *\r\n");
            pw.print("Connection: close\r\n\r\n");
            pw.flush();

            byte[] buf = new byte[32768];
            int read;
            while ((read = stream.read(buf)) > 0) {
                out.write(buf, 0, read);
            }
            out.flush();
            stream.close();
        }

        private String getMimeType(String path) {
            String lower = path.toLowerCase();
            if (lower.endsWith(".html") || lower.endsWith(".htm")) return "text/html; charset=utf-8";
            if (lower.endsWith(".js") || lower.endsWith(".mjs")) return "application/javascript; charset=utf-8";
            if (lower.endsWith(".css")) return "text/css; charset=utf-8";
            if (lower.endsWith(".json")) return "application/json; charset=utf-8";
            if (lower.endsWith(".wasm")) return "application/wasm";
            if (lower.endsWith(".png")) return "image/png";
            if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
            if (lower.endsWith(".svg")) return "image/svg+xml";
            if (lower.endsWith(".ico")) return "image/x-icon";
            return "application/octet-stream";
        }
    }

    public static class SecureSpaceNativeBridge {
        private final Activity mActivity;

        public SecureSpaceNativeBridge(Activity activity) {
            this.mActivity = activity;
        }

        @JavascriptInterface
        public String getDeviceInfo() {
            return "{\"model\":\"" + Build.MODEL + "\",\"manufacturer\":\"" + Build.MANUFACTURER + "\",\"apiLevel\":" + Build.VERSION.SDK_INT + "}";
        }

        @JavascriptInterface
        public boolean isAutoStartEnabled() {
            return true;
        }

        @JavascriptInterface
        public void showToast(final String message) {
            mActivity.runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    Toast.makeText(mActivity, message, Toast.LENGTH_SHORT).show();
                }
            });
        }

        @JavascriptInterface
        public String getOfflineStoragePath() {
            return new File(mActivity.getFilesDir(), "ai_secure_space").getAbsolutePath();
        }

        @JavascriptInterface
        public boolean isLocalFilesExtracted() {
            if (mActivity instanceof MainActivity) {
                return ((MainActivity) mActivity).mFilesExtracted;
            }
            return false;
        }
    }
}
