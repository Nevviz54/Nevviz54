'use strict';
// =====================================================================
//  ARGENTINA — Liga Profesional e Primera Nacional (temporada 2026)
//  A Liga Profesional tem 30 times: o jogo usa turno único.
// =====================================================================
DADOS.paises.push({
    id: 'ARG', nome: 'Argentina', bandeira: '🇦🇷', nomes: 'ar',
    ligas: [
        {
            id: 'ARG1', nome: 'Liga Profesional Argentina', curto: 'Liga Profesional', nivel: 1, troca: 2, riqueza: 0.45, times: [
                ['River Plate', 'RIV', 77, '#ffffff', '#e30613', `Franco Armani:GOL:39:77,Santiago Beltrán:GOL:21:70,Paulo Díaz:ZAG:31:76,Germán Pezzella:ZAG:35:75,Lucas Martínez Quarta:ZAG:30:77,Lautaro Rivero:ZAG:22:72,Gonzalo Montiel:LAT:29:76,Fabricio Bustos:LAT:30:74,Marcos Acuña:LAT:34:76,Kevin Castaño:VOL:25:75,Juan Carlos Portillo:VOL:25:72,Giuliano Galoppo:MEI:27:74,Maximiliano Meza:MEI:33:74,Ignacio Fernández:MEI:36:74,Juan Fernando Quintero:MEI:33:76,Santiago Lencina:MEI:20:72,Kendry Páez:MEI:19:74,Ian Subiabre:PON:19:74,Facundo Colidio:ATA:26:75,Maximiliano Salas:ATA:28:75,Miguel Borja:ATA:33:75,Sebastián Driussi:ATA:30:76`],
                ['Boca Juniors', 'BOC', 76, '#0033a0', '#ffd200', `Agustín Marchesín:GOL:38:75,Leandro Brey:GOL:23:71,Marcos Rojo:ZAG:36:72,Ayrton Costa:ZAG:26:74,Lautaro Di Lollo:ZAG:22:72,Nicolás Figal:ZAG:32:73,Luis Advíncula:LAT:36:72,Juan Barinaga:LAT:25:72,Lautaro Blanco:LAT:27:73,Frank Fabra:LAT:35:71,Leandro Paredes:VOL:31:80,Rodrigo Battaglia:VOL:34:74,Milton Delgado:VOL:20:73,Tomás Belmonte:MEI:28:73,Kevin Zenón:MEI:24:75,Ander Herrera:MEI:36:74,Carlos Palacios:PON:25:75,Exequiel Zeballos:PON:24:75,Brian Aguirre:PON:23:72,Edinson Cavani:ATA:39:74,Miguel Merentiel:ATA:30:76,Milton Giménez:ATA:29:73`],
                ['Racing Club', 'RAC', 75, '#75aadb', '#ffffff', `Facundo Cambeses:GOL:29:76,Gabriel Arias:GOL:38:72,Marco Di Césare:ZAG:24:75,Agustín García Basso:ZAG:34:72,Gastón Martirena:LAT:26:75,Facundo Mura:LAT:26:73,Gabriel Rojas:LAT:29:73,Santiago Sosa:VOL:27:76,Juan Nardoni:VOL:23:75,Bruno Zuculini:VOL:33:73,Agustín Almendra:MEI:26:74,Baltasar Rodríguez:MEI:22:73,Santiago Solari:PON:28:74,Duván Vergara:PON:30:73,Adrián Martínez:ATA:33:76,Tomás Conechny:ATA:27:72`],
                ['Independiente', 'IND', 73, '#e30613', '#ffffff', `Rodrigo Rey:GOL:35:74,Kevin Lomónaco:ZAG:24:74,Juan Fedorco:ZAG:26:72,Felipe Loyola:LAT:26:73,Federico Vera:LAT:27:71,Iván Marcone:VOL:35:72,Lautaro Millán:MEI:21:74,Luciano Cabral:MEI:30:75,Santiago Montiel:PON:26:74,Ignacio Pussetto:PON:30:72,Matías Abaldo:PON:21:72,Gabriel Ávalos:ATA:35:72`],
                ['San Lorenzo', 'SLO', 71, '#003a70', '#e30613', `Orlando Gill:GOL:26:74,Gastón Hernández:ZAG:27:72,Jhohan Romaña:ZAG:27:72,Elías Báez:LAT:21:71,Nicolás Tripichio:LAT:29:71,Nahuel Barrios:MEI:28:72,Matías Reali:PON:28:71,Andrés Vombergar:ATA:31:72,Alexis Cuello:ATA:26:72`],
                ['Estudiantes', 'EDL', 73, '#e30613', '#ffffff', `Fernando Muslera:GOL:39:75,Matías Mansilla:GOL:29:71,Santiago Núñez:ZAG:23:73,Leandro González Pírez:ZAG:34:72,Facundo Rodríguez:ZAG:24:71,Eric Meza:LAT:26:72,Gastón Benedetti:LAT:25:72,Santiago Ascacíbar:VOL:29:76,José Sosa:MEI:41:71,Mikel Amondarain:MEI:23:72,Tiago Palacios:PON:25:73,Edwuin Cetré:PON:28:75,Guido Carrillo:ATA:34:74,Lucas Alario:ATA:33:72`],
                ['Vélez Sarsfield', 'VEL', 73, '#ffffff', '#0055a5', `Tomás Marchiori:GOL:30:75,Emanuel Mammana:ZAG:30:74,Lisandro Magallán:ZAG:32:72,Joaquín García:LAT:25:72,Elías Gómez:LAT:31:72,Rodrigo Aliendro:VOL:35:72,Agustín Bouzat:MEI:32:73,Claudio Aquino:MEI:34:75,Braian Romero:ATA:34:73,Michael Santos:ATA:32:72`],
                ['Talleres', 'TAL', 72, '#0a1f44', '#ffffff', `Guido Herrera:GOL:34:75,Kevin Mantilla:ZAG:22:72,Juan Gabriel Rodríguez:ZAG:31:71,Matías Catalán:LAT:33:71,Blas Riveros:LAT:28:72,Ulises Ortegoza:VOL:27:72,Matías Galarza:VOL:23:74,Rubén Botta:MEI:36:72,Valentín Depietri:PON:24:73,Federico Girotti:ATA:26:74`],
                ['Huracán', 'HUR', 71, '#ffffff', '#e30613', `Hernán Galíndez:GOL:39:73,César Ibáñez:LAT:27:72,Leonardo Gil:VOL:34:72,Emmanuel Ojeda:VOL:26:71,Matko Miljevic:MEI:25:72,Facundo Waller:MEI:28:71`],
                ['Lanús', 'LAN', 73, '#8b1538', '#ffffff', `Nahuel Losada:GOL:33:73,Carlos Izquierdoz:ZAG:37:72,Raúl Loaiza:VOL:31:71,Ramiro Carrera:MEI:32:73,Marcelino Moreno:PON:31:73,Eduardo Salvio:PON:35:72,Walter Bou:ATA:32:73,Rodrigo Castillo:ATA:26:73`],
                ['Argentinos Juniors', 'AAJ', 70, '#e30613', '#ffffff', `Gonzalo Siri:GOL:31:71,Erik Godoy:ZAG:33:71,Alan Lescano:MEI:25:74,Leonardo Heredia:MEI:30:70,Hernán López Muñoz:PON:25:72,Tomás Molina:ATA:31:71`],
                ['Rosario Central', 'RCE', 73, '#003a70', '#ffd200', `Jorge Broun:GOL:39:72,Carlos Quintana:ZAG:37:70,Juan Cruz Komar:ZAG:30:72,Facundo Mallo:ZAG:30:72,Agustín Sández:LAT:25:72,Franco Ibarra:VOL:25:72,Ignacio Malcorra:MEI:38:72,Ángel Di María:PON:38:78,Jaminton Campaz:PON:26:74,Alejo Véliz:ATA:22:74,Enzo Copetti:ATA:30:72`],
                ['Newell\'s Old Boys', 'NOB', 69, '#e30613', '#000000', `Keylor Navas:GOL:39:75,Gustavo Velázquez:ZAG:35:70,Armando Méndez:LAT:30:70,Ever Banega:MEI:38:72,Luciano Herrera:PON:25:71`],
                ['Belgrano', 'BEL', 70, '#75aadb', '#ffffff', `Federico Ricca:LAT:31:70,Lucas Zelarayán:MEI:34:75,Lucas Passerini:ATA:31:72,Franco Jara:ATA:37:70`],
                ['Defensa y Justicia', 'DYJ', 69, '#f7d60f', '#00843d', ``],
                ['Unión de Santa Fe', 'UNI', 68, '#e30613', '#ffffff', ``],
                ['Tigre', 'TIG', 69, '#0033a0', '#e30613', ``],
                ['Platense', 'PLA', 69, '#8b4513', '#ffffff', ``],
                ['Banfield', 'BAN', 68, '#00843d', '#ffffff', ``],
                ['Gimnasia La Plata', 'GLP', 68, '#ffffff', '#003a70', ``],
                ['Instituto', 'INS', 67, '#e30613', '#ffffff', ``],
                ['Independiente Rivadavia', 'IRV', 68, '#003a70', '#ffffff', ``],
                ['Barracas Central', 'BCE', 66, '#e30613', '#ffffff', ``],
                ['Atlético Tucumán', 'ATU', 67, '#75aadb', '#ffffff', ``],
                ['Central Córdoba', 'CCO', 66, '#000000', '#ffffff', ``],
                ['Sarmiento', 'SAR', 65, '#00843d', '#ffffff', ``],
                ['Aldosivi', 'ALD', 65, '#00843d', '#f7d60f', ``],
                ['Deportivo Riestra', 'RIE', 65, '#000000', '#ffffff', ``],
                ['Gimnasia de Mendoza', 'GME', 65, '#000000', '#ffffff', ``],
                ['Estudiantes de Río Cuarto', 'ERC', 64, '#75aadb', '#ffffff', ``],
            ]
        },
        {
            id: 'ARG2', nome: 'Primera Nacional', curto: 'Primera Nacional', nivel: 2, troca: 0, riqueza: 0.08, times: [
                ['Godoy Cruz', 'GCR', 63, '#0055a5', '#ffffff', ``],
                ['San Martín de San Juan', 'SMJ', 61, '#00843d', '#000000', ``],
                ['San Martín de Tucumán', 'SMT', 61, '#e30613', '#ffffff', ``],
                ['Chacarita Juniors', 'CHA', 59, '#e30613', '#000000', ``],
                ['Ferro Carril Oeste', 'FER', 59, '#00843d', '#ffffff', ``],
                ['Quilmes', 'QUI', 59, '#ffffff', '#0033a0', ``],
                ['Atlanta', 'ATL', 58, '#ffd200', '#0033a0', ``],
                ['All Boys', 'ALB', 58, '#ffffff', '#000000', ``],
                ['Almirante Brown', 'ABR', 58, '#ffd200', '#000000', ``],
                ['Deportivo Morón', 'MOR', 58, '#e30613', '#ffffff', ``],
                ['Temperley', 'TEM', 58, '#75aadb', '#ffffff', ``],
                ['Chaco For Ever', 'CFE', 56, '#000000', '#ffffff', ``],
                ['Gimnasia de Jujuy', 'GJU', 57, '#0055a5', '#ffffff', ``],
                ['Defensores de Belgrano', 'DEB', 57, '#e30613', '#000000', ``],
                ['Colegiales', 'COL', 55, '#0055a5', '#e30613', ``],
                ['Agropecuario', 'AGR', 56, '#00843d', '#ffd200', ``],
                ['Tristán Suárez', 'TSU', 55, '#e30613', '#ffffff', ``],
                ['Los Andes', 'LAN', 56, '#e30613', '#ffffff', ``],
                ['Deportivo Madryn', 'MAD', 57, '#000000', '#ffffff', ``],
                ['Mitre (SdE)', 'MIT', 56, '#ffd200', '#000000', ``],
            ]
        },
    ],
});
