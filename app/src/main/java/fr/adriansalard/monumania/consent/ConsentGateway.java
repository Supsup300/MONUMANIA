package fr.adriansalard.monumania.consent;

public interface ConsentGateway {
    interface Callback {
        void onComplete(String status);
        void onFailed(String reason);
    }

    boolean isConfigured();
    void requestIfRequired(Callback callback);
}
