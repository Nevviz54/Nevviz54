import com.android.apksig.ApkSigner;
import com.android.apksig.ApkVerifier;

import java.io.File;
import java.io.FileInputStream;
import java.security.KeyStore;
import java.security.PrivateKey;
import java.security.cert.X509Certificate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * Assina o APK com o APK Signature Scheme v2 e verifica o resultado.
 *
 * O esquema v1 (JAR signing) do apksig 2.3.0 chama sun.security.pkcs.PKCS7 com
 * uma assinatura de metodo que nao existe mais no JDK 21, entao fica desligado.
 * Nao faz falta: do Android 7.0 (API 24) em diante o sistema valida o v2 e
 * ignora o v1, e a partir do targetSdk 30 o v2 e obrigatorio de qualquer forma.
 */
public class Assinar {
    public static void main(String[] args) throws Exception {
        File entrada = new File(args[0]);
        File saida = new File(args[1]);
        File ks = new File(args[2]);
        char[] senha = args[3].toCharArray();
        String alias = args[4];
        int minSdk = Integer.parseInt(args[5]);

        KeyStore keyStore = KeyStore.getInstance("PKCS12");
        try (FileInputStream in = new FileInputStream(ks)) {
            keyStore.load(in, senha);
        }
        PrivateKey chave = (PrivateKey) keyStore.getKey(alias, senha);
        java.security.cert.Certificate[] cadeia = keyStore.getCertificateChain(alias);
        List<X509Certificate> certs = new ArrayList<>();
        for (java.security.cert.Certificate c : cadeia) certs.add((X509Certificate) c);

        ApkSigner.SignerConfig cfg =
                new ApkSigner.SignerConfig.Builder("CLT", chave, certs).build();

        new ApkSigner.Builder(Collections.singletonList(cfg))
                .setInputApk(entrada)
                .setOutputApk(saida)
                .setMinSdkVersion(minSdk)
                .setV1SigningEnabled(false)
                .setV2SigningEnabled(true)
                .setCreatedBy("simulador-clt-es")
                .build()
                .sign();

        ApkVerifier.Result r = new ApkVerifier.Builder(saida)
                .setMinCheckedPlatformVersion(minSdk)
                .build()
                .verify();

        System.out.println("assinatura valida : " + r.isVerified());
        System.out.println("esquema v1 (JAR)  : " + r.isVerifiedUsingV1Scheme());
        System.out.println("esquema v2        : " + r.isVerifiedUsingV2Scheme());
        for (X509Certificate c : r.getSignerCertificates()) {
            System.out.println("assinante         : " + c.getSubjectX500Principal());
        }
        for (Object e : r.getErrors())   System.out.println("ERRO   : " + e);
        for (Object w : r.getWarnings()) System.out.println("aviso  : " + w);
        if (!r.isVerified()) System.exit(1);
    }
}
