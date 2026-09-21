package fr.adriansalard.monumania.consent;

import android.app.Activity;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;

import org.json.JSONObject;

import java.util.concurrent.atomic.AtomicBoolean;

public final class NativeConsentBridge {
    private final Activity activity;
    private final WebView webView;
    private final ConsentGateway gateway;

    public NativeConsentBridge(Activity activity, WebView webView, ConsentGateway gateway) {
        this.activity = activity;
        this.webView = webView;
        this.gateway = gateway;
    }

    @JavascriptInterface
    public boolean isReady() {
        return gateway.isConfigured();
    }

    @JavascriptInterface
    public void requestIfRequired(String requestId, String ignoredPayload) {
        activity.runOnUiThread(() -> {
            AtomicBoolean settled = new AtomicBoolean(false);
            gateway.requestIfRequired(new ConsentGateway.Callback() {
                @Override
                public void onComplete(String status) {
                    if (!settled.compareAndSet(false, true)) return;
                    resolve(requestId, "{\"status\":" + JSONObject.quote(status) + "}");
                }

                @Override
                public void onFailed(String reason) {
                    if (settled.compareAndSet(false, true)) reject(requestId, reason);
                }
            });
        });
    }

    private void resolve(String requestId, String jsonPayload) {
        String script = "window.__monumaniaNativeCallbacks&&window.__monumaniaNativeCallbacks.resolve("
                + JSONObject.quote(requestId) + "," + JSONObject.quote(jsonPayload) + ")";
        webView.post(() -> webView.evaluateJavascript(script, null));
    }

    private void reject(String requestId, String reason) {
        String script = "window.__monumaniaNativeCallbacks&&window.__monumaniaNativeCallbacks.reject("
                + JSONObject.quote(requestId) + ","
                + JSONObject.quote(reason == null ? "consent_failed" : reason) + ")";
        webView.post(() -> webView.evaluateJavascript(script, null));
    }
}
