package ai.secure.space;

import android.content.Context;

/**
 * Top-level LocalMicroServer wrapper delegating to the comprehensive
 * MainActivity.LocalMicroServer asset & micro-daemon implementation.
 */
public class LocalMicroServer extends MainActivity.LocalMicroServer {
    public LocalMicroServer(Context context, int port) {
        super(context, port);
    }
}
