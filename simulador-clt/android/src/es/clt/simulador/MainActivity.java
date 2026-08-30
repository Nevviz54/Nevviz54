package es.clt.simulador;

import android.app.Activity;
import android.content.res.AssetManager;
import android.os.Bundle;
import android.view.KeyEvent;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;

/**
 * Casca nativa do Simulador CLT ES.
 *
 * O jogo inteiro e um unico HTML em assets/. Em vez de carregar por file://
 * (onde o localStorage fica em origem opaca e o save se perde), o HTML e lido
 * como texto e injetado com loadDataWithBaseURL numa origem https estavel:
 * assim o WebView trata a pagina como um site normal e o save persiste.
 */
public class MainActivity extends Activity {

    private static final String BASE_URL = "https://simulador-clt-es.local/";
    private WebView web;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        requestWindowFeature(Window.FEATURE_NO_TITLE);
        getWindow().setFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON,
                             WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);

        web = new WebView(this);
        web.setBackgroundColor(0xFF0A0A0C);

        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setUseWideViewPort(false);
        s.setLoadWithOverviewMode(false);
        s.setBuiltInZoomControls(false);
        s.setSupportZoom(false);

        web.setWebViewClient(new WebViewClient());
        setContentView(web);

        web.loadDataWithBaseURL(BASE_URL, lerAsset("index.html"),
                                "text/html", "utf-8", null);
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
                try { in.close(); } catch (Exception ignored) { }
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
}
