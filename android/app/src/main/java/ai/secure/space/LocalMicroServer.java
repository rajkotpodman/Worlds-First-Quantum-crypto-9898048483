package ai.secure.space;

import android.content.Context;
import android.util.Log;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.ServerSocket;
import java.net.Socket;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class LocalMicroServer {
    private static final String TAG = "LocalMicroServer";
    private final Context mContext;
    private int mPort;
    private ServerSocket mServerSocket;
    private volatile boolean mRunning = false;
    private ExecutorService mExecutor;

    public LocalMicroServer(Context context, int port) {
        this.mContext = context;
        this.mPort = port;
    }

    public synchronized void start() {
        if (mRunning) return;
        mRunning = true;
        mExecutor = Executors.newCachedThreadPool();

        new Thread(new Runnable() {
            @Override
            public void run() {
                try {
                    mServerSocket = new ServerSocket(mPort);
                    Log.i(TAG, "LocalMicroServer listening on port: " + mPort);
                    while (mRunning && !mServerSocket.isClosed()) {
                        final Socket socket = mServerSocket.accept();
                        if (!mRunning) {
                            try { socket.close(); } catch (Exception ignored) {}
                            break;
                        }
                        mExecutor.execute(new Runnable() {
                            @Override
                            public void run() {
                                handleClient(socket);
                            }
                        });
                    }
                } catch (Exception e) {
                    if (mRunning) {
                        Log.e(TAG, "Server socket exception: " + e.getMessage());
                    }
                }
            }
        }, "LocalMicroServerThread").start();
    }

    private void handleClient(Socket socket) {
        try {
            BufferedReader reader = new BufferedReader(new InputStreamReader(socket.getInputStream(), StandardCharsets.UTF_8));
            String line = reader.readLine();
            if (line == null) {
                socket.close();
                return;
            }

            String responseBody = "{\"status\":\"ONLINE\",\"node\":\"AI_SECURE_SPACE_DAEMON\",\"version\":\"2.0.0\",\"pqc_state\":\"ACTIVE\",\"port\":" + mPort + "}\n";
            byte[] bodyBytes = responseBody.getBytes(StandardCharsets.UTF_8);

            OutputStream out = socket.getOutputStream();
            String header = "HTTP/1.1 200 OK\r\n" +
                    "Content-Type: application/json; charset=utf-8\r\n" +
                    "Access-Control-Allow-Origin: *\r\n" +
                    "Content-Length: " + bodyBytes.length + "\r\n" +
                    "Connection: close\r\n\r\n";

            out.write(header.getBytes(StandardCharsets.UTF_8));
            out.write(bodyBytes);
            out.flush();
            socket.close();
        } catch (Exception e) {
            try { socket.close(); } catch (Exception ignored) {}
        }
    }

    public int getPort() {
        return mPort;
    }

    public synchronized void stop() {
        mRunning = false;
        try {
            if (mServerSocket != null && !mServerSocket.isClosed()) {
                mServerSocket.close();
            }
        } catch (Exception ignored) {}
        if (mExecutor != null) {
            mExecutor.shutdownNow();
        }
        Log.i(TAG, "LocalMicroServer stopped.");
    }
}
