package com.kartel99games.monumania.ads;

public final class AdConfig {

    public enum Environment { SIMULATION, PRODUCTION }

    public static final Environment ENVIRONMENT = Environment.SIMULATION;

    public static final String ADMOB_APP_ID =
            "ca-app-pub-6035067894119408~1325155490";

    public static final String REWARDED_AD_UNIT_ID =
            "ca-app-pub-6035067894119408/9012073827";

    public static final String INTERSTITIAL_AD_UNIT_ID =
            "ca-app-pub-6035067894119408/6385910488";

    private AdConfig() {}
}
