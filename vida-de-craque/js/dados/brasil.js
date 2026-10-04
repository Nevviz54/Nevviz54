'use strict';
// =====================================================================
//  BRASIL — Séries A, B, C e D (temporada 2026)
//  Formato dos jogadores: "Nome:POSIÇÃO:idade:overall"
//  Posições: GOL, ZAG, LAT, VOL, MEI, PON, ATA
//  Os elencos são completados automaticamente com jogadores da base.
// =====================================================================
DADOS.paises.push({
    id: 'BRA', nome: 'Brasil', bandeira: '🇧🇷', nomes: 'br',
    ligas: [
        {
            id: 'BRA1', nome: 'Brasileirão Série A', curto: 'Série A', nivel: 1, troca: 4, riqueza: 0.8, times: [
                ['Flamengo', 'FLA', 80, '#c8102e', '#111111', `Rossi:GOL:31:80,Matheus Cunha:GOL:25:68,Varela:LAT:33:76,Emerson Royal:LAT:27:76,Ayrton Lucas:LAT:28:75,Alex Sandro:LAT:35:76,Léo Ortiz:ZAG:30:79,Léo Pereira:ZAG:30:79,Danilo:ZAG:35:76,Jorginho:VOL:35:80,Pulgar:VOL:32:75,Saúl:VOL:32:77,Evertton Araújo:VOL:23:70,De la Cruz:MEI:29:80,Arrascaeta:MEI:32:83,Carrascal:MEI:28:77,Luiz Araújo:PON:30:77,Samuel Lino:PON:27:78,Plata:PON:26:77,Everton Cebolinha:PON:30:74,Bruno Henrique:ATA:36:76,Pedro:ATA:29:80,Wallace Yan:ATA:21:68`],
                ['Palmeiras', 'PAL', 80, '#006437', '#ffffff', `Weverton:GOL:38:77,Carlos Miguel:GOL:27:74,Gustavo Gómez:ZAG:33:79,Murilo:ZAG:29:77,Bruno Fuchs:ZAG:27:74,Micael:ZAG:25:73,Giay:LAT:22:75,Khellven:LAT:25:74,Piquerez:LAT:28:77,Jefté:LAT:22:70,Aníbal Moreno:VOL:27:77,Emiliano Martínez:VOL:26:75,Lucas Evangelista:VOL:31:73,Marlon Freitas:VOL:31:77,Andreas Pereira:MEI:30:78,Raphael Veiga:MEI:31:78,Maurício:MEI:25:75,Felipe Anderson:PON:33:76,Allan:PON:22:72,Facundo Torres:PON:26:77,Ramón Sosa:PON:27:76,Vitor Roque:ATA:21:77,Flaco López:ATA:25:77,Paulinho:ATA:25:76`],
                ['Cruzeiro', 'CRU', 77, '#1a3e8e', '#ffffff', `Cássio:GOL:39:75,Otávio:GOL:23:66,Fabrício Bruno:ZAG:30:77,Villalba:ZAG:31:75,João Marcelo:ZAG:25:72,William:LAT:31:75,Fagner:LAT:37:72,Kaiki:LAT:23:72,Lucas Romero:VOL:32:76,Lucas Silva:VOL:33:74,Christian:VOL:25:74,Walace:VOL:31:75,Matheus Pereira:MEI:30:80,Eduardo:MEI:36:72,Matheus Henrique:MEI:28:75,Wanderson:PON:31:74,Arroyo:PON:20:72,Kaio Jorge:ATA:24:78,Gabigol:ATA:29:75`],
                ['Mirassol', 'MIR', 72, '#f7d60f', '#00843d', `Walter:GOL:38:72,Reinaldo:LAT:36:72,Lucas Ramon:LAT:31:70,João Victor:ZAG:27:71,Jemmes:ZAG:31:70,Danielzinho:VOL:31:71,Neto Moura:VOL:30:71,Shaylon:MEI:29:71,Negueba:PON:33:72,Alesson:PON:26:71,Chico da Costa:ATA:26:72,Iury Castilho:ATA:30:71`],
                ['Fluminense', 'FLU', 76, '#7a0c2e', '#00613c', `Fábio:GOL:45:72,Vitor Eudes:GOL:28:68,Samuel Xavier:LAT:36:72,Guga:LAT:28:72,Renê:LAT:33:71,Freytes:ZAG:25:74,Ignácio:ZAG:28:73,Thiago Santos:ZAG:36:70,Martinelli:VOL:25:75,Hércules:VOL:25:75,Facundo Bernal:VOL:22:72,Nonato:VOL:28:72,Ganso:MEI:36:74,Lima:MEI:29:72,Canobbio:PON:28:75,Serna:PON:28:76,Soteldo:PON:29:75,Keno:PON:36:71,Germán Cano:ATA:38:74,Everaldo:ATA:34:72,John Kennedy:ATA:24:72`],
                ['Botafogo', 'BOT', 76, '#000000', '#ffffff', `John:GOL:30:76,Léo Linck:GOL:25:70,Vitinho:LAT:27:74,Alex Telles:LAT:33:76,Cuiabano:LAT:23:73,Mateo Ponte:LAT:22:70,Barboza:ZAG:31:76,Bastos:ZAG:34:74,David Ricardo:ZAG:23:72,Gregore:VOL:32:75,Danilo Barbosa:VOL:30:73,Newton:VOL:25:72,Savarino:MEI:30:78,Montoro:MEI:19:72,Santi Rodríguez:MEI:26:74,Artur:PON:28:75,Matheus Martins:PON:22:73,Jeffinho:PON:27:72,Arthur Cabral:ATA:28:74,Chris Ramos:ATA:29:71`],
                ['Bahia', 'BAH', 75, '#0055a5', '#e30613', `Marcos Felipe:GOL:30:74,Ronaldo:GOL:29:70,Gilberto:LAT:33:74,Santiago Arias:LAT:34:73,Luciano Juba:LAT:27:75,Gabriel Xavier:ZAG:24:73,David Duarte:ZAG:31:73,Kanu:ZAG:29:72,Ramos Mingo:ZAG:25:73,Caio Alexandre:VOL:27:76,Acevedo:VOL:27:74,Jean Lucas:VOL:27:75,Rodrigo Nestor:MEI:25:74,Everton Ribeiro:MEI:37:75,Cauly:MEI:30:75,Michel Araújo:MEI:29:74,Erick Pulga:PON:25:74,Ademir:PON:31:73,Kayky:PON:23:71,Willian José:ATA:34:74,Tiago:ATA:27:70`],
                ['São Paulo', 'SAO', 76, '#ffffff', '#e30613', `Rafael:GOL:36:75,Jandrei:GOL:33:70,Wendell:LAT:32:74,Enzo Díaz:LAT:30:73,Cédric Soares:LAT:34:72,Arboleda:ZAG:34:76,Alan Franco:ZAG:30:75,Sabino:ZAG:29:73,Ferraresi:ZAG:27:74,Pablo Maia:VOL:24:76,Alisson:VOL:32:74,Marcos Antônio:VOL:26:75,Bobadilla:VOL:25:74,Oscar:MEI:34:77,Lucas Moura:MEI:33:77,Ferreirinha:PON:28:73,Luciano:ATA:32:75,Calleri:ATA:32:77,André Silva:ATA:28:73,Tapia:ATA:23:72`],
                ['Grêmio', 'GRE', 75, '#0d80bf', '#000000', `Tiago Volpi:GOL:35:74,Gabriel Grando:GOL:25:70,João Pedro:LAT:29:72,Marlon:LAT:29:72,Kannemann:ZAG:35:74,Wagner Leonardo:ZAG:26:73,Gustavo Martins:ZAG:22:72,Balbuena:ZAG:34:74,Villasanti:VOL:29:77,Dodi:VOL:30:74,Cuéllar:VOL:33:73,Edenilson:MEI:36:73,Cristaldo:MEI:29:76,Arthur:MEI:30:75,Amuzu:PON:26:74,Aravena:PON:23:73,Alysson:PON:22:70,Braithwaite:ATA:35:74,Carlos Vinícius:ATA:31:74,André Henrique:ATA:22:70`],
                ['Red Bull Bragantino', 'RBB', 74, '#ffffff', '#d6001c', `Cleiton:GOL:28:74,Lucão:GOL:25:70,Juninho Capixaba:LAT:29:72,Andrés Hurtado:LAT:26:73,Luan Cândido:LAT:25:72,Pedro Henrique:ZAG:29:73,Eduardo Santos:ZAG:28:72,Guzmán Rodríguez:ZAG:27:72,Gabriel:VOL:24:72,Matheus Fernandes:VOL:27:72,Jhon Jhon:MEI:24:75,Eric Ramires:MEI:24:72,Vinicinho:PON:25:72,Henry Mosquera:PON:25:72,Isidro Pitta:ATA:26:74,Eduardo Sasha:ATA:34:72`],
                ['Atlético-MG', 'CAM', 76, '#000000', '#ffffff', `Everson:GOL:35:76,Gabriel Delfim:GOL:22:68,Natanael:LAT:23:72,Guilherme Arana:LAT:29:77,Saravia:LAT:32:72,Junior Alonso:ZAG:33:76,Lyanco:ZAG:29:75,Iván Román:ZAG:23:73,Vitor Hugo:ZAG:34:72,Alan Franco:VOL:27:76,Fausto Vera:VOL:26:75,Gabriel Menino:VOL:25:73,Gustavo Scarpa:MEI:32:77,Bernard:MEI:33:74,Igor Gomes:MEI:27:73,Rony:PON:31:74,Dudu:PON:34:74,Cuello:PON:26:74,Hulk:ATA:39:79,Biel:PON:24:72`],
                ['Santos', 'SAN', 74, '#ffffff', '#000000', `Gabriel Brazão:GOL:25:75,João Paulo:GOL:30:72,Escobar:LAT:28:72,Mayke:LAT:33:72,Souza:LAT:19:72,Igor Vinícius:LAT:29:72,Zé Ivaldo:ZAG:29:73,Luisão:ZAG:24:70,Adonis Frías:ZAG:28:73,Luan Peres:ZAG:32:71,Zé Rafael:VOL:33:74,João Schmidt:VOL:33:73,Tomás Rincón:VOL:38:72,Willian Arão:VOL:34:72,Neymar:MEI:34:83,Rollheiser:MEI:26:73,Thaciano:MEI:31:72,Gabriel Bontempo:MEI:20:68,Barreal:PON:25:74,Guilherme:PON:30:73,Robinho Jr:PON:18:68,Tiquinho Soares:ATA:35:72,Lautaro Díaz:ATA:27:73`],
                ['Corinthians', 'COR', 76, '#000000', '#ffffff', `Hugo Souza:GOL:27:77,Felipe Longo:GOL:21:66,Matheuzinho:LAT:25:74,Angileri:LAT:32:72,Matheus Bidu:LAT:27:73,Félix Torres:ZAG:29:74,Gustavo Henrique:ZAG:33:75,André Ramalho:ZAG:34:74,Cacá:ZAG:27:73,José Martínez:VOL:32:76,Raniele:VOL:29:74,Breno Bidon:VOL:21:73,Maycon:VOL:28:74,André Carrillo:MEI:35:75,Rodrigo Garro:MEI:28:79,Romero:PON:34:74,Talles Magno:PON:24:72,Memphis Depay:ATA:32:80,Yuri Alberto:ATA:25:77,Gui Negão:ATA:19:66`],
                ['Vasco', 'VAS', 74, '#000000', '#ffffff', `Léo Jardim:GOL:31:76,Daniel Fuzato:GOL:28:68,Paulo Henrique:LAT:29:73,Puma Rodríguez:LAT:29:72,Lucas Piton:LAT:25:74,João Victor:ZAG:27:73,Robert Renan:ZAG:22:72,Lucas Freitas:ZAG:24:70,Hugo Moura:VOL:28:73,Tchê Tchê:VOL:33:72,Thiago Mendes:VOL:34:72,Philippe Coutinho:MEI:33:78,Nuno Moreira:PON:27:73,Adson:PON:25:72,Andrés Gómez:PON:23:72,David:PON:30:71,Rayan:ATA:19:75,Vegetti:ATA:37:74`],
                ['Vitória', 'VIT', 70, '#e30613', '#000000', `Lucas Arcanjo:GOL:27:72,Raúl Cáceres:LAT:34:70,Jamerson:LAT:29:69,Lucas Halter:ZAG:26:71,Neris:ZAG:34:70,Zé Marcos:ZAG:30:69,Willian Oliveira:VOL:33:70,Baralhas:VOL:25:70,Matheuzinho:MEI:30:72,Wellington Rato:PON:34:71,Osvaldo:PON:39:68,Renato Kayzer:ATA:30:72,Janderson:ATA:27:70`],
                ['Internacional', 'SCI', 75, '#e30613', '#ffffff', `Rochet:GOL:33:77,Anthoni:GOL:24:70,Aguirre:LAT:26:72,Bernabei:LAT:26:75,Vitão:ZAG:26:75,Mercado:ZAG:39:72,Juninho:ZAG:28:72,Clayton Sampaio:ZAG:30:71,Thiago Maia:VOL:29:75,Fernando:VOL:38:73,Bruno Henrique:VOL:36:73,Rômulo:VOL:25:70,Alan Patrick:MEI:35:77,Bruno Tabata:MEI:29:73,Wesley:PON:26:74,Vitinho:PON:32:72,Carbonero:PON:26:74,Borré:ATA:30:77,Enner Valencia:ATA:36:75,Ricardo Mathias:ATA:21:68`],
                ['Coritiba', 'CFC', 70, '#00544e', '#ffffff', `Pedro Morisco:GOL:22:72,Maicon:ZAG:37:70,Tiago Cóser:ZAG:28:69,Zeca:LAT:32:69,Sebastián Gómez:VOL:30:71,Josué:MEI:36:71,Lucas Ronier:PON:21:70,Clayson:PON:31:69,Gustavo Coutinho:ATA:26:69`],
                ['Athletico-PR', 'CAP', 72, '#c8102e', '#000000', `Santos:GOL:36:73,Mycael:GOL:22:70,Esquivel:LAT:27:71,Benavídez:LAT:27:71,Léo Godoy:LAT:31:70,Arthur Dias:ZAG:23:70,Felipinho:VOL:21:70,Zapelli:MEI:24:73,Kevin Viveros:ATA:26:73`],
                ['Chapecoense', 'CHA', 67, '#00843d', '#ffffff', ``],
                ['Remo', 'REM', 67, '#00205b', '#ffffff', `Marcelo Rangel:GOL:38:68,Pedro Rocha:ATA:31:70`],
            ]
        },
        {
            id: 'BRA2', nome: 'Brasileirão Série B', curto: 'Série B', nivel: 2, troca: 4, riqueza: 0.25, times: [
                ['Sport', 'SPT', 68, '#e30613', '#000000', `Caíque França:GOL:30:68,Lucas Lima:MEI:35:70,Zé Lucas:VOL:19:70,Gonçalo Paciência:ATA:31:69,Pablo:ATA:34:68`],
                ['Juventude', 'JVT', 66, '#00843d', '#ffffff', `Gilberto:ATA:36:68`],
                ['Fortaleza', 'FOR', 70, '#0041a3', '#e30613', `João Ricardo:GOL:37:72,Brítez:ZAG:33:72,Tinga:LAT:32:71,Bruno Pacheco:LAT:34:69,Lucas Sasha:VOL:35:70,Pochettino:MEI:30:71,Breno Lopes:PON:30:71,Marinho:PON:36:70,Lucero:ATA:34:73`],
                ['Ceará', 'CEA', 68, '#000000', '#ffffff', `Fernando Sobral:VOL:31:70,Lourenço:MEI:30:69,Pedro Raul:ATA:29:71`],
                ['Goiás', 'GOI', 66, '#006437', '#ffffff', `Tadeu:GOL:34:70`],
                ['Novorizontino', 'NOV', 66, '#f7d60f', '#000000', `Jordi:GOL:32:68`],
                ['Criciúma', 'CRI', 65, '#f7d60f', '#000000', ``],
                ['Cuiabá', 'CUI', 66, '#00843d', '#f7d60f', ``],
                ['Avaí', 'AVA', 64, '#0055a5', '#ffffff', ``],
                ['CRB', 'CRB', 64, '#e30613', '#ffffff', ``],
                ['Vila Nova', 'VIL', 63, '#e30613', '#ffffff', ``],
                ['Atlético-GO', 'ACG', 65, '#e30613', '#000000', ``],
                ['Operário-PR', 'OPE', 62, '#000000', '#ffffff', ``],
                ['América-MG', 'AME', 65, '#00843d', '#000000', ``],
                ['Botafogo-SP', 'BFS', 61, '#e30613', '#000000', ``],
                ['Athletic-MG', 'ATH', 60, '#000000', '#ffffff', ``],
                ['Londrina', 'LON', 61, '#0055a5', '#ffffff', ``],
                ['São Bernardo', 'SBE', 60, '#f7d60f', '#000000', ``],
                ['Náutico', 'NAU', 61, '#e30613', '#ffffff', ``],
                ['Ponte Preta', 'PON', 62, '#000000', '#ffffff', ``],
            ]
        },
        {
            id: 'BRA3', nome: 'Brasileirão Série C', curto: 'Série C', nivel: 3, troca: 4, riqueza: 0.1, times: [
                ['Paysandu', 'PAY', 60, '#0091d5', '#ffffff', ``],
                ['Amazonas', 'AMZ', 58, '#f7d60f', '#000000', ``],
                ['Volta Redonda', 'VRE', 58, '#f7d60f', '#000000', ``],
                ['Ferroviária', 'FER', 59, '#8b1538', '#ffffff', ``],
                ['Brusque', 'BRU', 57, '#e30613', '#f7d60f', ``],
                ['Caxias', 'CAX', 57, '#8b1538', '#ffffff', ``],
                ['Figueirense', 'FIG', 58, '#000000', '#ffffff', ``],
                ['Guarani', 'GUA', 59, '#00843d', '#ffffff', ``],
                ['Ituano', 'ITU', 57, '#e30613', '#000000', ``],
                ['Botafogo-PB', 'BPB', 56, '#000000', '#ffffff', ``],
                ['Confiança', 'CON', 56, '#0055a5', '#ffffff', ``],
                ['Floresta', 'FLO', 55, '#00843d', '#ffffff', ``],
                ['Maringá', 'MAR', 55, '#0055a5', '#ffffff', ``],
                ['Anápolis', 'ANA', 54, '#e30613', '#ffffff', ``],
                ['ABC', 'ABC', 57, '#000000', '#ffffff', ``],
                ['Itabaiana', 'ITA', 54, '#0055a5', '#ffffff', ``],
                ['Ypiranga-RS', 'YPI', 55, '#00843d', '#f7d60f', ``],
                ['Santa Cruz', 'STC', 58, '#e30613', '#000000', ``],
                ['Inter de Limeira', 'INL', 56, '#000000', '#ffffff', ``],
                ['Barra-SC', 'BAR', 54, '#e30613', '#ffffff', ``],
            ]
        },
        {
            id: 'BRA4', nome: 'Brasileirão Série D', curto: 'Série D', nivel: 4, troca: 0, riqueza: 0.05, times: [
                ['CSA', 'CSA', 55, '#0055a5', '#ffffff', ``],
                ['Tombense', 'TOM', 54, '#e30613', '#ffffff', ``],
                ['Retrô', 'RET', 53, '#e30613', '#000000', ``],
                ['América-RN', 'AMR', 53, '#e30613', '#ffffff', ``],
                ['Sampaio Corrêa', 'SAM', 54, '#f7d60f', '#00843d', ``],
                ['Treze', 'TRE', 52, '#000000', '#ffffff', ``],
                ['Ferroviário', 'FRR', 52, '#000000', '#e30613', ``],
                ['ASA', 'ASA', 51, '#000000', '#ffffff', ``],
                ['Brasiliense', 'BRS', 52, '#f7d60f', '#00843d', ``],
                ['Gama', 'GAM', 51, '#00843d', '#ffffff', ``],
                ['Joinville', 'JEC', 53, '#e30613', '#000000', ``],
                ['Portuguesa', 'POR', 54, '#e30613', '#00843d', ``],
                ['XV de Piracicaba', 'XVP', 51, '#000000', '#ffffff', ``],
                ['Manaus', 'MAN', 51, '#000000', '#f7d60f', ``],
                ['Tuna Luso', 'TUN', 50, '#00843d', '#e30613', ``],
                ['Moto Club', 'MOT', 50, '#e30613', '#000000', ``],
                ['Sergipe', 'SER', 50, '#e30613', '#ffffff', ``],
                ['Altos', 'ALT', 50, '#00843d', '#ffffff', ``],
                ['Cianorte', 'CIA', 50, '#0055a5', '#ffffff', ``],
                ['Aparecidense', 'APA', 51, '#000000', '#ffffff', ``],
            ]
        },
    ],
});
