package com.dfbg.simuladorcltes;

import android.app.Activity;
import android.content.res.AssetManager;
import android.os.Bundle;
import android.view.KeyEvent;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.lang.reflect.Method;

/**
 * Casca nativa do Simulador CLT ES.
 *
 * O jogo inteiro e um unico HTML em assets/. Em vez de carregar por file://
 * (onde o localStorage fica em origem opaca e o save se perde), o HTML e lido
 * como texto e injetado com loadDataWithBaseURL numa origem https estavel:
 * assim o WebView trata a pagina como um site normal e o save persiste.
 *
 * Alguns ajustes so existem em APIs mais novas que a android.jar usada para
 * compilar (API 16, a mais recente publicada no Maven Central). Eles sao
 * chamados por reflexao e simplesmente nao acontecem em aparelhos antigos.
 */
public class MainActivity extends Activity {

    private static final String BASE_URL = "https://simulador-clt-es.local/";
    private static final int FUNDO = 0xFF0A0A0C;

    private WebView web;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        requestWindowFeature(Window.FEATURE_NO_TITLE);
        getWindow().setFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON,
                             WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        pintarBarrasDoSistema();

        web = new WebView(this);
        web.setBackgroundColor(FUNDO);

        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setAllowFileAccess(true);
        s.setAllowContentAccess(true);
        s.setUseWideViewPort(false);
        s.setLoadWithOverviewMode(false);
        s.setBuiltInZoomControls(false);
        s.setDisplayZoomControls(false);
        s.setSupportZoom(false);
        // API 17+: deixa a trilha e os efeitos comecarem sem exigir um toque.
        chamar(s, "setMediaPlaybackRequiresUserGesture", boolean.class, Boolean.FALSE);

        web.setWebViewClient(new WebViewClient());
        web.setWebChromeClient(new WebChromeClient());
        setContentView(web);

        web.loadDataWithBaseURL(BASE_URL, lerAsset("index.html"),
                                "text/html", "utf-8", null);
    }

    /** Deixa as barras de status e de navegacao na cor de fundo do jogo. */
    private void pintarBarrasDoSistema() {
        try {
            Window w = getWindow();
            w.addFlags(0x80000000);                  // DRAWS_SYSTEM_BAR_BACKGROUNDS
            w.clearFlags(0x04000000 | 0x02000000);   // TRANSLUCENT_STATUS | _NAVIGATION
            chamar(w, "setStatusBarColor", int.class, Integer.valueOf(FUNDO));
            chamar(w, "setNavigationBarColor", int.class, Integer.valueOf(FUNDO));
        } catch (Throwable ignorado) { }
    }

    /** Chama um metodo que pode nao existir na versao do Android do aparelho. */
    private static void chamar(Object alvo, String nome, Class<?> tipo, Object valor) {
        try {
            Method m = alvo.getClass().getMethod(nome, tipo);
            m.invoke(alvo, valor);
        } catch (Throwable ignorado) { }
    }

    private String lerAsset(String nome) {
        InputStream in = null;
        try {
            AssetManager am = getAssets();
            in = am.open(nome);
            ByteArrayOutputStream out = new ByteArrayOutputStream(262144);
            byte[] buf = new byte[16384];
            int n;
            while ((n = in.read(buf)) > 0) {
                out.write(buf, 0, n);
            }
            return new String(out.toByteArray(), "UTF-8");
        } catch (Exception e) {
            return "<html><body style='background:#0a0a0c;color:#f2f2f5;"
                 + "font-family:sans-serif;padding:24px'><h2>Erro ao abrir o jogo</h2><p>"
                 + e.toString() + "</p></body></html>";
        } finally {
            if (in != null) {
                try { in.close(); } catch (Exception ignorado) { }
            }
        }
    }

    @Override
    public boolean onKeyDown(int keyCode, KeyEvent event) {
        if (keyCode == KeyEvent.KEYCODE_BACK && web != null && web.canGoBack()) {
            web.goBack();
            return true;
        }
        return super.onKeyDown(keyCode, event);
    }

    @Override
    protected void onDestroy() {
        if (web != null) {
            web.loadUrl("about:blank");
            web.stopLoading();
            web.destroy();
            web = null;
        }
        super.onDestroy();
    }
}
