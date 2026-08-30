import com.reandroid.arsc.chunk.PackageBlock;
import com.reandroid.arsc.chunk.TableBlock;
import com.reandroid.arsc.value.Entry;

import java.io.FileOutputStream;
import java.io.OutputStream;

/**
 * Gera o resources.arsc com o ARSCLib.
 *
 * Sem tabela de recursos o APK ate instala, mas o launcher mostra o icone
 * generico do Android: android:icon so aceita referencia a recurso, nunca um
 * caminho literal. Aqui criamos a tabela minima com o icone e o nome do app.
 *
 * Uso: GerarRecursos <saida.arsc>
 * Imprime na saida padrao o id de cada recurso criado, para o manifesto
 * ser compilado com o valor certo.
 */
public class GerarRecursos {

    private static final String PACOTE = "es.clt.simulador";

    public static void main(String[] args) throws Exception {
        TableBlock tabela = new TableBlock();
        PackageBlock pacote = tabela.newPackage(0x7f, PACOTE);

        Entry icone = pacote.getOrCreate("", "mipmap", "ic_launcher");
        icone.setValueAsString("res/ic_launcher.png");

        Entry nome = pacote.getOrCreate("", "string", "app_name");
        nome.setValueAsString("Simulador CLT ES");

        pacote.refreshFull();
        tabela.refresh();

        try (OutputStream out = new FileOutputStream(args[0])) {
            out.write(tabela.getBytes());
        }

        System.out.println("icone=0x" + Integer.toHexString(icone.getResourceId()));
        System.out.println("nome=0x" + Integer.toHexString(nome.getResourceId()));
        System.out.println("bytes=" + tabela.getBytes().length);
    }
}
