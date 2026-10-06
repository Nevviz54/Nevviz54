'use strict';
// =====================================================================
//  HOLANDA — Eredivisie e Eerste Divisie
//  Elencos de outubro de 2026 (temporada 2026/27 na Europa).
//  Formato dos jogadores: "Nome:POSIÇÃO:idade:overall"
//  Posições: GOL, ZAG, LAT, VOL, MEI, PON, ATA
//  Os elencos são completados automaticamente com jogadores da base.
// =====================================================================
DADOS.paises.push({
    id: "NED", nome: "Holanda", bandeira: "🇳🇱", nomes: "nl",
    ligas: [
        {
            id: "NED1", nome: "Eredivisie", curto: "Eredivisie", nivel: 1, troca: 2, riqueza: 0.6, times: [
                ["PSV", "PSV", 78, "#ed1c24", "#ffffff", `Matěj Kovář:GOL:26:78,Ryan Flamingo:ZAG:23:78,Yarek Gasiorowski:ZAG:21:75,Armando Obispo:ZAG:27:74,Sergiño Dest:LAT:25:77,Mauro Júnior:LAT:27:77,Kiliann Sildillia:LAT:24:73,Filip Kostić:LAT:33:75,Jerdy Schouten:VOL:29:79,Ayoni Santos:VOL:21:71,Guus Til:MEI:28:77,Paul Wanner:MEI:20:78,Sven Mijnans:MEI:26:77,Kodai Sano:MEI:23:75,Ivan Perišić:PON:37:76,Dennis Man:PON:28:77,Ruben van Bommel:PON:22:76,Sami Ouaissa:PON:22:73,Esmir Bajraktarević:PON:21:74,Ricardo Pepi:ATA:23:77,Sam Lammers:ATA:29:73,Alassane Pléa:ATA:33:73`],
                ["Ajax", "AJX", 76, "#ffffff", "#d2122e", `Marc-André ter Stegen:GOL:34:81,Youri Baas:ZAG:23:76,Ko Itakura:ZAG:29:76,Daley Blind:ZAG:36:73,Aaron Bouwman:ZAG:19:70,Lucas Rosa:LAT:26:74,Anton Gaaei:LAT:23:73,Owen Wijndal:LAT:26:72,Jorthy Mokio:LAT:18:72,Caio Henrique:LAT:29:76,Sofyan Amrabat:VOL:30:77,Youri Regeer:MEI:23:74,Davy Klaassen:MEI:33:73,Oliver Edvardsen:MEI:27:74,Julian Brandt:MEI:30:80,Oscar Gloukh:MEI:22:76,Steven Berghuis:PON:34:74,Rayane Bounida:PON:20:73,Raúl Moro:PON:23:73,Marcos Leonardo:ATA:23:77,Tolu Arokodare:ATA:25:74`],
                ["Feyenoord", "FEY", 77, "#ef0d1e", "#ffffff", `Tjark Ernst:GOL:23:75,Timon Wellenreuther:GOL:30:75,Jeremiah St. Juste:ZAG:29:75,Tsuyoshi Watanabe:ZAG:29:75,Mika Mármol:ZAG:25:74,Thomas Beelen:ZAG:25:73,Givairo Read:LAT:20:77,Jordan Bos:LAT:23:75,Gijs Smal:LAT:29:72,Charles Vanhoutte:VOL:28:76,Oussama Targhalline:VOL:24:74,Hwang In-beom:MEI:30:78,Luciano Valente:MEI:23:76,Sem Steijn:MEI:24:77,Anis Hadj Moussa:PON:24:78,Gonçalo Borges:PON:25:74,Leo Sauer:PON:20:73,Nacho Ferri:ATA:22:74,Ayase Ueda:ATA:28:77,Casper Tengstedt:ATA:26:72,Shaqueel van Persie:ATA:19:66`],
                ["AZ Alkmaar", "AZ", 75, "#e30613", "#ffffff", `Rome-Jayden Owusu-Oduro:GOL:22:76,Jari De Busser:GOL:27:72,Wouter Goes:ZAG:22:75,Alexandre Penetra:ZAG:25:74,Wesley Hoedt:ZAG:32:72,Mees de Wit:LAT:28:74,Seiya Maikuma:LAT:28:73,Denso Kasius:LAT:24:73,David Møller Wolfe:LAT:24:72,Peer Koopmeiners:VOL:26:73,Jordy Clasie:VOL:35:72,Kees Smit:MEI:20:78,Calvin Stengs:MEI:27:74,Stije Resink:MEI:23:72,Ibrahim Sadiq:PON:26:74,Mexx Meerdink:ATA:23:73,Maximilian Ibrahimović:ATA:20:66`],
                ["Utrecht", "UTR", 73, "#e30613", "#ffffff", `Vasilios Barkas:GOL:32:75,Mike van der Hoorn:ZAG:33:72,Nick Viergever:ZAG:37:70,Siebe Horemans:LAT:28:72,Souffian El Karouani:LAT:25:74,Niklas Vesterlund:LAT:26:72,Alonzo Engwanda:VOL:20:72,Jens Toornstra:MEI:37:69,Can Bozdoğan:MEI:25:73,Victor Jensen:MEI:26:73,Yoann Cathline:PON:24:74,Miguel Rodríguez:PON:23:72,Adrian Blake:PON:20:72,Sébastien Haller:ATA:32:73,David Min:ATA:26:72,Noah Ohio:ATA:23:72`],
                ["Twente", "TWE", 73, "#e30613", "#ffffff", `Lars Unnerstall:GOL:35:73,Przemysław Tytoń:GOL:39:67,Mees Hilgers:ZAG:24:75,Robin Pröpper:ZAG:32:72,Max Bruns:ZAG:23:72,Bart van Rooij:LAT:24:73,Mats Rots:LAT:20:73,Thomas van den Belt:VOL:24:72,Michel Vlap:MEI:28:74,Daan Rots:PON:24:74,Sayfallah Ltaief:PON:25:72,Mitchell van Bergen:PON:26:72,Ricky van Wolfswinkel:ATA:37:70`],
                ["NEC Nijmegen", "NEC", 71, "#e30613", "#00843d", `Stijn van Gassel:GOL:29:71,Philippe Sandler:ZAG:29:71,Ivan Márquez:ZAG:31:71,Bram Nuytinck:ZAG:36:69,Brayann Pereira:LAT:22:71,Dirk Proper:MEI:23:74,Mees Hoedemakers:MEI:27:72,Tjaronn Chery:MEI:38:69,Sontje Hansen:PON:24:72,Vito van Crooij:PON:29:70,Koki Ogawa:ATA:28:72`],
                ["Go Ahead Eagles", "GAE", 70, "#e30613", "#f7d60f", `Joris Kramer:ZAG:30:70,Gerrit Nauber:ZAG:34:68,Mats Deijl:LAT:28:71,Dean James:LAT:26:70,Evert Linthorst:MEI:24:71,Mathis Suray:PON:24:70,Victor Edvardsen:ATA:29:73`],
                ["Heerenveen", "HEE", 69, "#0055a5", "#ffffff", `Andries Noppert:GOL:32:72,Pawel Bochniewicz:ZAG:30:70,Oliver Braude:LAT:22:69,Amara Condé:VOL:28:70,Luuk Brouwers:MEI:28:70,Levi Smans:MEI:22:71,Jacob Trenskow:PON:26:73,Ion Nicolăescu:ATA:27:72`],
                ["Sparta Rotterdam", "SPA", 67, "#e30613", "#ffffff", `Nick Olij:GOL:31:72,Marvin Young:ZAG:28:68,Teo Quintero:ZAG:25:68,Saïd Bakari:LAT:32:68,Julian Baas:VOL:24:70,Joshua Kitolano:MEI:25:70,Pelle Clement:MEI:30:69,Mohamed Nassoh:MEI:23:70,Shunsuke Mito:PON:24:71,Charles-Andreas Brym:PON:28:69,Camiel Neghli:PON:25:70`],
                ["Groningen", "GRO", 67, "#00843d", "#ffffff", `Etienne Vaessen:GOL:31:72,Marco Rente:ZAG:29:70,Thijmen Blokzijl:ZAG:21:71,Marvin Peersman:LAT:35:67,Leandro Bacuna:MEI:35:69,Tika de Jonge:MEI:22:70,Johan Hove:MEI:26:70,Jorg Schreuders:MEI:23:70,Thom van Bergen:PON:23:71,Romano Postema:ATA:24:70,Brynjólfur Willumsson:ATA:26:70`],
                ["Fortuna Sittard", "FSI", 66, "#ffd200", "#00843d", `Mattijs Branderhorst:GOL:32:70,Shawn Adewoye:ZAG:26:69,Jasper Dahlhaus:LAT:25:69,Ryan Fosso:VOL:24:70,Makan Aiko:MEI:22:69,Kristoffer Peterson:PON:31:71,Kaj Sierhuis:ATA:28:71`],
                ["PEC Zwolle", "PEC", 66, "#0055a5", "#ffffff", `Jasper Schendelaar:GOL:29:70,Sam Kersten:ZAG:28:69,Anselmo García MacNulty:ZAG:23:69,Simon Graves:ZAG:27:68,Davy van den Berg:MEI:26:70,Odysseus Velanas:MEI:28:69,Ryan Thomas:MEI:31:70,Younes Namli:MEI:32:69,Dylan Mbayo:PON:25:69,Kaj de Rooij:PON:26:68,Thomas Buitink:ATA:26:69,Ferdy Druijf:ATA:28:71`],
                ["Excelsior", "EXC", 64, "#e30613", "#000000", ``],
                ["Telstar", "TEL", 63, "#ffffff", "#e30613", `Ronald Koeman Jr.:GOL:27:67,Cedric Hatenboer:MEI:28:66,Tyrese Noslin:PON:25:67`],
                ["ADO Den Haag", "ADO", 64, "#ffd200", "#00843d", ``],
                ["Willem II", "WII", 64, "#e30613", "#0055a5", `Maxim Dekker:ZAG:22:68,Finn Stam:LAT:22:67`],
                ["Cambuur", "CAM", 63, "#ffd200", "#0055a5", ``],
            ],
        },
        {
            id: "NED2", nome: "Eerste Divisie", curto: "Eerste Divisie", nivel: 2, troca: 0, riqueza: 0.08, times: [
                ["Heracles", "HER", 62, "#000000", "#ffffff", `Fabian de Keijzer:GOL:26:67,Ivan Mesík:ZAG:25:67,Damon Mirani:ZAG:30:66,Mimeirhel Benita:LAT:23:66,Thomas Bruns:MEI:34:65,Brian De Keersmaecker:MEI:27:66,Sem Scheperman:MEI:24:66,Bryan Limbombe:PON:25:67,Jizz Hornkamp:ATA:28:67`],
                ["NAC Breda", "NAC", 62, "#ffd200", "#000000", `Daniel Bielica:GOL:27:68,Jan Van den Bergh:ZAG:32:66,Leo Greiml:ZAG:25:67,Boy Kemper:LAT:29:66,Clint Leemans:MEI:31:67,Dominik Janošek:MEI:28:67,Elías Már Ómarsson:ATA:31:67`],
                ["Volendam", "VOL", 61, "#ff7f00", "#ffffff", `Robert Mühren:ATA:37:64`],
                ["RKC Waalwijk", "RKC", 61, "#ffd200", "#0055a5", ``],
                ["Almere City", "ALM", 61, "#e30613", "#000000", ``],
                ["De Graafschap", "DGR", 59, "#0055a5", "#ffffff", ``],
                ["Roda JC", "RJC", 59, "#ffd200", "#000000", ``],
                ["Vitesse", "VIT", 59, "#ffd200", "#000000", ``],
                ["Dordrecht", "DOR", 58, "#e30613", "#ffffff", ``],
                ["Emmen", "EMM", 58, "#e30613", "#ffffff", ``],
                ["Den Bosch", "DBO", 57, "#0055a5", "#ffffff", ``],
                ["MVV Maastricht", "MVV", 57, "#e30613", "#ffffff", ``],
                ["VVV-Venlo", "VVV", 57, "#ffd200", "#000000", ``],
                ["FC Eindhoven", "EIN", 57, "#0055a5", "#ffffff", ``],
                ["Helmond Sport", "HEL", 56, "#ff7f00", "#000000", ``],
                ["TOP Oss", "TOP", 56, "#e30613", "#ffffff", ``],
                ["Jong Ajax", "JAJ", 58, "#ffffff", "#d2122e", ``],
                ["Jong PSV", "JPS", 58, "#ed1c24", "#ffffff", ``],
                ["Jong AZ", "JAZ", 57, "#e30613", "#ffffff", ``],
                ["Jong Utrecht", "JUT", 56, "#e30613", "#ffffff", ``],
            ],
        },
    ],
});
