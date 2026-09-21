package com.kartel99games.monumania;

import android.app.Activity;
import android.graphics.Color;
import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import androidx.webkit.WebViewAssetLoader;

import com.google.android.gms.ads.MobileAds;

import com.kartel99games.monumania.ads.AdMobAdsGateway;
import com.kartel99games.monumania.ads.AdsGateway;
import com.kartel99games.monumania.ads.NativeAdsBridge;

public final class MainActivity extends Activity {

    private static final String APP_HOST = "appassets.androidplatform.net";
    private static final String START_URL =
            "https://" + APP_HOST + "/assets/public/index.html";

    private WebView webView;
    private AdsGateway adsGateway;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        WebViewAssetLoader assetLoader =
                new WebViewAssetLoader.Builder()
                        .addPathHandler(
                                "/assets/",
                                new WebViewAssetLoader.AssetsPathHandler(this)
                        )
                        .build();

        webView = new WebView(this);
        webView.setBackgroundColor(Color.rgb(6, 29, 53));

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        settings.setMediaPlaybackRequiresUserGesture(true);

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public android.webkit.WebResourceResponse shouldInterceptRequest(
                    WebView view,
                    android.webkit.WebResourceRequest request) {

                return assetLoader.shouldInterceptRequest(request.getUrl());
            }
        });

        setContentView(webView);

        /*
         * Initialisation du SDK Google Mobile Ads.
         * Une seule initialisation au lancement de l'application.
         */
        new Thread(() ->
                MobileAds.initialize(
                        MainActivity.this,
                        initializationStatus -> {
                        }
                )
        ).start();

        /*
         * Passerelle entre MONUMANIA et les publicités AdMob.
         */
        adsGateway = new AdMobAdsGateway(this);

        webView.addJavascriptInterface(
                new NativeAdsBridge(this, webView, adsGateway),
                "MonumaniaAds"
        );

        webView.loadUrl(START_URL);
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }

    @Override
    protected void onDestroy() {
        if (webView != null) {
            webView.removeJavascriptInterface("MonumaniaAds");
            webView.destroy();
            webView = null;
        }

        super.onDestroy();
    }
}
