package fr.adriansalard.monumania.ads;

import android.app.Activity;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;

import org.json.JSONObject;

import java.util.concurrent.atomic.AtomicBoolean;

public final class NativeAdsBridge {
    private final Activity activity;
    private final WebView webView;
    private final AdsGateway gateway;

    public NativeAdsBridge(Activity activity, WebView webView, AdsGateway gateway) {
        this.activity = activity;
        this.webView = webView;
        this.gateway = gateway;
    }

    @JavascriptInterface
    public boolean isReady() {
        return gateway.isConfigured();
    }

    @JavascriptInterface
    public String environment() {
        return AdConfig.ENVIRONMENT.name().toLowerCase();
    }

    @JavascriptInterface
    public void showRewarded(String requestId, String payloadJson) {
        String placement = readPlacement(payloadJson);
        activity.runOnUiThread(() -> {
            AtomicBoolean rewarded = new AtomicBoolean(false);
            AtomicBoolean settled = new AtomicBoolean(false);
            gateway.showRewarded(placement, new AdsGateway.RewardedCallback() {
                @Override
                public void onRewardGranted() {
                    rewarded.set(true);
                }

                @Override
                public void onClosed() {
                    if (settled.compareAndSet(false, true)) {
                        resolve(requestId, "{\"rewarded\":" + rewarded.get() + "}");
                    }
                }

                @Override
                public void onFailed(String reason) {
                    if (settled.compareAndSet(false, true)) reject(requestId, reason);
                }
            });
        });
    }

    @JavascriptInterface
    public void showInterstitial(String requestId, String payloadJson) {
        String placement = readPlacement(payloadJson);
        activity.runOnUiThread(() -> {
            AtomicBoolean settled = new AtomicBoolean(false);
            gateway.showInterstitial(placement, new AdsGateway.InterstitialCallback() {
                @Override
                public void onClosed() {
                    if (settled.compareAndSet(false, true)) resolve(requestId, "{\"closed\":true}");
                }

                @Override
                public void onFailed(String reason) {
                    if (settled.compareAndSet(false, true)) reject(requestId, reason);
                }
            });
        });
    }

    private String readPlacement(String payloadJson) {
        try {
            return new JSONObject(payloadJson).optString("placement", "unknown");
        } catch (Exception ignored) {
            return "unknown";
        }
    }

    private void resolve(String requestId, String jsonPayload) {
        String script = "window.__monumaniaNativeCallbacks&&window.__monumaniaNativeCallbacks.resolve("
                + JSONObject.quote(requestId) + "," + JSONObject.quote(jsonPayload) + ")";
        webView.post(() -> webView.evaluateJavascript(script, null));
    }

    private void reject(String requestId, String reason) {
        String script = "window.__monumaniaNativeCallbacks&&window.__monumaniaNativeCallbacks.reject("
                + JSONObject.quote(requestId) + ","
                + JSONObject.quote(reason == null ? "ad_failed" : reason) + ")";
        webView.post(() -> webView.evaluateJavascript(script, null));
    }
}
