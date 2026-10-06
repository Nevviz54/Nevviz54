'use strict';
// =====================================================================
//  ARGENTINA — Liga Profesional e Primera Nacional
//  Elencos de outubro de 2026 (temporada 2026/27 na Europa).
//  Formato dos jogadores: "Nome:POSIÇÃO:idade:overall"
//  Posições: GOL, ZAG, LAT, VOL, MEI, PON, ATA
//  Os elencos são completados automaticamente com jogadores da base.
// =====================================================================
DADOS.paises.push({
    id: "ARG", nome: "Argentina", bandeira: "🇦🇷", nomes: "ar",
    ligas: [
        {
            id: "ARG1", nome: "Liga Profesional Argentina", curto: "Liga Profesional", nivel: 1, troca: 2, riqueza: 0.45, times: [
                ["River Plate", "RIV", 77, "#ffffff", "#e30613", `Santiago Beltrán:GOL:22:73,Franco Armani:GOL:39:75,Nicolás Otamendi:ZAG:38:76,Lucas Martínez Quarta:ZAG:30:77,Lautaro Rivero:ZAG:22:73,Germán Pezzella:ZAG:35:74,Gonzalo Montiel:LAT:29:76,Marcos Acuña:LAT:34:75,Matías Viña:LAT:28:73,Giovanni González:LAT:32:72,Fausto Vera:VOL:26:75,Mauro Arambarri:VOL:31:76,Kevin Castaño:VOL:26:75,Aníbal Moreno:VOL:27:74,Matías Galarza:VOL:23:74,Tobías Andrada:MEI:22:72,Tomás Galván:MEI:26:74,Thiago Almada:MEI:25:80,Juan Fernando Quintero:MEI:33:75,Santiago Lencina:MEI:20:72,Ángel Correa:PON:31:79,Ian Subiabre:PON:19:74,Sebastián Driussi:ATA:30:76,Rafael Santos Borré:ATA:31:76,Lucas Beltrán:ATA:25:75,Facundo Colidio:ATA:26:74,Maximiliano Salas:ATA:28:74`],
                ["Boca Juniors", "BOC", 76, "#0033a0", "#ffd200", `Álvaro Montero:GOL:31:75,Agustín Marchesín:GOL:38:73,Leandro Brey:GOL:23:71,Lautaro Di Lollo:ZAG:22:74,Ayrton Costa:ZAG:26:74,Nicolás Figal:ZAG:32:72,Leandro Lozano:LAT:27:73,Lautaro Blanco:LAT:27:74,Juan Barinaga:LAT:25:72,Luis Advíncula:LAT:36:71,Frank Fabra:LAT:35:70,Leandro Paredes:VOL:32:80,Santiago Ascacíbar:VOL:29:76,Milton Delgado:VOL:20:74,Rodrigo Battaglia:VOL:34:73,Alan Velasco:MEI:24:75,Kevin Zenón:MEI:24:75,Tomás Belmonte:MEI:28:72,Carlos Palacios:PON:25:75,Exequiel Zeballos:PON:24:75,Sebastián Villa:PON:30:75,Marino Hinestroza:PON:24:74,Brian Aguirre:PON:23:72,Ángel Romero:PON:34:73,Miguel Merentiel:ATA:30:76,Milton Giménez:ATA:29:73`],
                ["Racing Club", "RAC", 75, "#75aadb", "#ffffff", `Facundo Cambeses:GOL:29:76,Gabriel Arias:GOL:38:71,Marcos Rojo:ZAG:36:72,Marco Di Césare:ZAG:24:75,Agustín García Basso:ZAG:34:72,Ezequiel Cannavo:LAT:31:71,Gastón Martirena:LAT:26:75,Gabriel Rojas:LAT:29:73,Matías Kranevitter:VOL:33:74,Ulises Ortegoza:VOL:27:73,Santiago Sosa:VOL:27:76,Juan Nardoni:VOL:23:75,Bruno Zuculini:VOL:33:72,Agustín Almendra:MEI:26:74,Gastón Lodico:MEI:28:72,Matko Miljevic:MEI:25:73,Santiago Solari:PON:28:74,Duván Vergara:PON:30:73,Adrián Martínez:ATA:33:76,Tomás Conechny:ATA:27:73`],
                ["Independiente", "IND", 73, "#e30613", "#ffffff", `Rodrigo Rey:GOL:35:74,Kevin Lomónaco:ZAG:24:74,Juan Fedorco:ZAG:26:72,Franco Calderón:ZAG:28:70,Leonardo Godoy:LAT:31:72,Facundo Zabala:LAT:27:72,Felipe Loyola:LAT:26:73,Federico Vera:LAT:27:71,Iván Marcone:VOL:35:72,Mateo Pérez Curci:VOL:21:70,Lautaro Millán:MEI:21:74,Luciano Cabral:MEI:30:75,Maximiliano Meza:MEI:33:73,Santiago Montiel:PON:26:74,Matías Abaldo:PON:21:72,Chimy Ávila:ATA:32:74,Gabriel Ávalos:ATA:35:71`],
                ["San Lorenzo", "SLO", 71, "#003a70", "#e30613", `José Devecchi:GOL:31:71,Orlando Gill:GOL:26:73,Danilo Arboleda:ZAG:31:71,Guzmán Corujo:ZAG:30:71,Emiliano Amor:ZAG:31:70,Gastón Hernández:ZAG:27:72,Jhohan Romaña:ZAG:27:72,Ezequiel Herrera:LAT:24:70,Mathías De Ritis:LAT:30:70,Elías Báez:LAT:21:71,Nicolás Tripichio:LAT:29:71,Manuel Insaurralde:VOL:22:69,Martín Río:VOL:25:69,Juan Pablo Álvarez:MEI:30:70,Nahuel Barrios:MEI:28:72,Ignacio Zaballa:MEI:20:66,Facundo Farías:PON:24:73,Matías Reali:PON:28:71,Alexis Cuello:ATA:26:73,Rodrigo Auzmendi:ATA:25:71,Andrés Vombergar:ATA:31:71`],
                ["Estudiantes", "EDL", 73, "#e30613", "#ffffff", `Fernando Muslera:GOL:40:74,Santiago Núñez:ZAG:23:74,Leandro González Pírez:ZAG:34:72,Tomás Palacios:ZAG:23:72,Facundo Rodríguez:ZAG:24:71,Eros Mancuso:LAT:27:72,Eric Meza:LAT:26:72,Gastón Benedetti:LAT:25:72,Ezequiel Piovi:VOL:35:71,Baltasar Rodríguez:MEI:22:74,Alexis Castro:MEI:32:71,Mikel Amondarain:MEI:23:72,José Sosa:MEI:41:70,Edwuin Cetré:PON:28:75,Tiago Palacios:PON:25:73,Joaquín Tobio Burgos:PON:24:71,Joaquín Correa:ATA:32:76,Guido Carrillo:ATA:35:74,Lucas Alario:ATA:33:71`],
                ["Vélez Sarsfield", "VEL", 73, "#ffffff", "#0055a5", `Tomás Marchiori:GOL:30:75,Emanuel Mammana:ZAG:30:74,Lisandro Magallán:ZAG:32:72,Joaquín García:LAT:25:72,Elías Gómez:LAT:31:72,Rodrigo Aliendro:VOL:35:72,Claudio Aquino:MEI:34:75,Manuel Lanzini:MEI:33:72,Braian Romero:ATA:34:73`],
                ["Talleres", "TAL", 72, "#0a1f44", "#ffffff", `Ezequiel Unsain:GOL:31:72,Guido Herrera:GOL:34:74,Matías Catalán:ZAG:33:71,Kevin Mantilla:ZAG:22:72,Juan Gabriel Rodríguez:ZAG:31:71,Augusto Schott:LAT:27:71,Gabriel Báez:LAT:30:70,Blas Riveros:LAT:28:71,Federico Fattori:VOL:34:71,Juan Sforza:VOL:24:72,Franco Cristaldo:MEI:30:73,Rubén Botta:MEI:36:71,Valentín Depietri:PON:24:73,Rick:PON:27:72,Agustín Álvarez Martínez:ATA:25:73,Federico Girotti:ATA:26:74`],
                ["Huracán", "HUR", 71, "#ffffff", "#e30613", `Hernán Galíndez:GOL:39:72,Fabio Pereyra:ZAG:27:70,Lucas Blondel:LAT:30:71,César Ibáñez:LAT:27:72,Leonardo Gil:VOL:34:71,Emmanuel Ojeda:VOL:26:71,Facundo Waller:MEI:28:71,Óscar Cortés:PON:23:72,Ignacio Pussetto:PON:30:72,Jordy Caicedo:ATA:28:72`],
                ["Lanús", "LAN", 73, "#8b1538", "#ffffff", `Nahuel Losada:GOL:33:73,Carlos Izquierdoz:ZAG:37:72,José Canale:LAT:30:72,Sasha Marcich:LAT:25:71,Raúl Loaiza:VOL:31:71,Ramiro Carrera:MEI:32:73,Marcelino Moreno:PON:31:73,Eduardo Salvio:PON:35:72,Dylan Aquino:PON:22:71,Walter Bou:ATA:32:73`],
                ["Argentinos Juniors", "AAJ", 70, "#e30613", "#ffffff", `Gonzalo Siri:GOL:31:71,Erik Godoy:ZAG:33:71,Enzo Pérez:VOL:40:71,Alan Lescano:MEI:25:74,Leonardo Heredia:MEI:30:70,Hernán López Muñoz:PON:25:72,Tomás Molina:ATA:31:71`],
                ["Rosario Central", "RCE", 73, "#003a70", "#ffd200", `Jorge Broun:GOL:39:72,Carlos Quintana:ZAG:37:70,Juan Cruz Komar:ZAG:30:72,Facundo Mallo:ZAG:30:72,Agustín Sández:LAT:25:72,Franco Ibarra:VOL:25:72,Ángel Di María:PON:38:77,Jaminton Campaz:PON:26:74,Alejo Véliz:ATA:22:74,Enzo Copetti:ATA:30:72`],
                ["Newell's Old Boys", "NOB", 69, "#e30613", "#000000", `Gustavo Velázquez:ZAG:35:70,Armando Méndez:LAT:30:70,Ever Banega:MEI:38:72`],
                ["Belgrano", "BEL", 70, "#75aadb", "#ffffff", `Federico Ricca:LAT:31:70,Lucas Zelarayán:MEI:34:75,Lucas Passerini:ATA:31:72,Franco Jara:ATA:37:70`],
                ["Defensa y Justicia", "DYJ", 69, "#f7d60f", "#00843d", `Matías Borgogno:GOL:34:69,Damián Fernández:ZAG:25:67,David Martínez:ZAG:25:68,Lucas Souto:LAT:25:67,Máximo Rodríguez:LAT:22:66,César Pérez:VOL:27:68,Julián López:VOL:26:68,Agustín Hausch:MEI:25:69,David Barbona:MEI:31:69,Juan Gutiérrez:PON:24:68,Leandro Fernández:ATA:35:70`],
                ["Unión de Santa Fe", "UNI", 68, "#e30613", "#ffffff", `Matías Mansilla:GOL:29:71,Maizon Rodríguez:ZAG:23:70,Juan Pablo Ludueña:ZAG:26:68,Juan Pintado:LAT:25:68,Bruno Pittón:LAT:33:70,Lucas Menossi:VOL:34:69,Emilio Giaccone:MEI:23:68,Ignacio Malcorra:MEI:39:71,Sebastián Palacios:PON:34:70,Marcelo Estigarribia:ATA:28:70,Cristian Tarragona:ATA:35:70`],
                ["Tigre", "TIG", 69, "#0033a0", "#e30613", ``],
                ["Platense", "PLA", 69, "#8b4513", "#ffffff", `Juan Pablo Cozzani:GOL:32:70,Ignacio Vázquez:ZAG:29:70,Leonel Picco:VOL:28:70,Guido Mainero:MEI:31:70,Augusto Lotti:ATA:30:69`],
                ["Banfield", "BAN", 68, "#00843d", "#ffffff", `Diego Rodríguez:GOL:30:68,Nicolás Meriano:ZAG:26:69,Santiago Daniele:ZAG:24:67,Brandon Oviedo:ZAG:24:67,Santiago López García:LAT:24:67,Ignacio Abraham:LAT:25:68,Santiago Esquivel:VOL:24:67,Tomás Adoryán:VOL:25:69,David Zalazar:MEI:26:68,Lisandro Piñero:ATA:22:66,Adrián Balboa:ATA:32:70`],
                ["Gimnasia La Plata", "GLP", 68, "#ffffff", "#003a70", `Nelson Insfrán:GOL:31:70,Enzo Martínez:ZAG:27:69,Pedro Silva Torrejón:ZAG:24:69,Bautista Barros Schelotto:LAT:20:67,Matías Melluso:LAT:28:70,Mateo Seoane:VOL:23:68,Nicolás Barros Schelotto:MEI:24:69,Ignacio Fernández:MEI:36:72,Juan José Pérez:MEI:25:67,Manuel Panaro:PON:23:70,Agustín Auzmendi:ATA:28:70`],
                ["Instituto", "INS", 67, "#e30613", "#ffffff", `Marcos Ledesma:GOL:30:68,Jonathan Galván:ZAG:34:70,Leonel Mosevich:ZAG:29:70,Fernando Alarcón:ZAG:32:70,Giuliano Cerato:LAT:26:70,Gustavo Abregú:VOL:28:70,Matías Gallardo:VOL:26:68,Diego Sosa:MEI:26:68,Alex Luna:PON:24:71,Matías Tissera:ATA:26:68,Jeremías Lázaro:ATA:24:67`],
                ["Independiente Rivadavia", "IRV", 68, "#003a70", "#ffffff", `Sheyko Studer:ZAG:25:69,Leonard Costa:LAT:34:68,Alex Arce:ATA:31:72`],
                ["Barracas Central", "BCE", 66, "#e30613", "#ffffff", `Marcelo Miño:GOL:29:69,Kevin Jappert:LAT:27:68,Rodrigo Insúa:VOL:27:69,Iván Tapia:MEI:28:70,Jhonatan Candia:PON:31:69,Facundo Bruera:ATA:28:70`],
                ["Atlético Tucumán", "ATU", 67, "#75aadb", "#ffffff", `Tomás Durso:GOL:27:69,Marcelo Ortiz:ZAG:29:69,Clever Ferreira:LAT:27:68,Kevin Ortiz:VOL:29:69,Renzo Tesuri:MEI:30:70`],
                ["Central Córdoba", "CCO", 66, "#000000", "#ffffff", `Alan Aguerre:GOL:36:70,Yuri Casermeiro:ZAG:27:68,Alejandro Maciel:ZAG:28:68,Santiago Moyano:ZAG:26:67,Fernando Martínez:LAT:26:67,Matías Vera:VOL:31:70,Darío Cáceres:VOL:27:67,Lucas González:MEI:26:67,Horacio Tijanovich:PON:30:69,Diego Barrera:PON:25:67,Michael Santos:ATA:32:71`],
                ["Sarmiento", "SAR", 65, "#00843d", "#ffffff", `Thyago Ayala:GOL:25:66,Renzo Orihuela:ZAG:25:68,Juan Manuel Insaurralde:ZAG:42:65,Santiago Salle:LAT:27:66,Lucas Suárez:LAT:27:66,Julián Contrera:VOL:27:67,Mauricio Martínez:VOL:33:68,Cristian Zabala:MEI:26:66,Julián Mavilla:PON:23:66,Jonathan Herrera:ATA:35:68,Junior Marabel:ATA:24:68`],
                ["Aldosivi", "ALD", 65, "#00843d", "#f7d60f", ``],
                ["Deportivo Riestra", "RIE", 65, "#000000", "#ffffff", `Ignacio Arce:GOL:34:68,Milton Céliz:MEI:34:68`],
                ["Gimnasia de Mendoza", "GME", 65, "#000000", "#ffffff", `César Rigamonti:GOL:39:69,Diego Mondino:ZAG:31:68,Ezequiel Muñoz:ZAG:36:69,Luciano Paredes:LAT:27:66,Matías Recalde:LAT:25:66,Fermín Antonini:VOL:29:68,Tomás O'Connor:MEI:30:69,Facundo Lencioni:MEI:30:68,Esteban Fernández:PON:26:67,Luciano Cingolani:PON:29:68,Agustín Módica:ATA:28:69`],
                ["Estudiantes de Río Cuarto", "ERC", 64, "#75aadb", "#ffffff", ``],
            ],
        },
        {
            id: "ARG2", nome: "Primera Nacional", curto: "Primera Nacional", nivel: 2, troca: 0, riqueza: 0.08, times: [
                ["Godoy Cruz", "GCR", 63, "#0055a5", "#ffffff", ``],
                ["San Martín de San Juan", "SMJ", 61, "#00843d", "#000000", ``],
                ["San Martín de Tucumán", "SMT", 61, "#e30613", "#ffffff", ``],
                ["Chacarita Juniors", "CHA", 59, "#e30613", "#000000", ``],
                ["Ferro Carril Oeste", "FER", 59, "#00843d", "#ffffff", ``],
                ["Quilmes", "QUI", 59, "#ffffff", "#0033a0", ``],
                ["Atlanta", "ATL", 58, "#ffd200", "#0033a0", ``],
                ["All Boys", "ALB", 58, "#ffffff", "#000000", ``],
                ["Almirante Brown", "ABR", 58, "#ffd200", "#000000", ``],
                ["Deportivo Morón", "MOR", 58, "#e30613", "#ffffff", ``],
                ["Temperley", "TEM", 58, "#75aadb", "#ffffff", ``],
                ["Chaco For Ever", "CFE", 56, "#000000", "#ffffff", ``],
                ["Gimnasia de Jujuy", "GJU", 57, "#0055a5", "#ffffff", ``],
                ["Defensores de Belgrano", "DEB", 57, "#e30613", "#000000", ``],
                ["Colegiales", "COL", 55, "#0055a5", "#e30613", ``],
                ["Agropecuario", "AGR", 56, "#00843d", "#ffd200", ``],
                ["Tristán Suárez", "TSU", 55, "#e30613", "#ffffff", ``],
                ["Los Andes", "LAN", 56, "#e30613", "#ffffff", ``],
                ["Deportivo Madryn", "MAD", 57, "#000000", "#ffffff", ``],
                ["Mitre (SdE)", "MIT", 56, "#ffd200", "#000000", ``],
            ],
        },
    ],
});
