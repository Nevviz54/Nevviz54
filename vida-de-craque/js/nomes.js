'use strict';
// =====================================================================
//  Nomes usados para completar os elencos (jogadores da base, reservas
//  das divisões de baixo e jovens que surgem a cada temporada).
// =====================================================================

const NOMES = {
    br: {
        p: 'João Pedro Lucas Gabriel Matheus Rafael Gustavo Felipe Bruno Thiago Vinícius Carlos Diego Rodrigo Leonardo Eduardo André Caio Igor Renan Wellington Douglas Danilo Everton Luan Kaio Yago Murilo Vitor Henrique Marcos Alisson Wesley Willian Robson Fabrício Jefferson Paulo Ramon Guilherme Erick Davi Arthur Samuel Ryan Kauã Breno Luiz Otávio'.split(' '),
        s: 'Silva Santos Oliveira Souza Lima Pereira Costa Ferreira Rodrigues Almeida Nascimento Carvalho Araújo Ribeiro Gomes Martins Barbosa Rocha Dias Moura Cardoso Teixeira Freitas Mendes Batista Vieira Monteiro Correia Pinto Cavalcanti Farias Moreira Nunes Ramos Campos Lopes Machado Siqueira Fonseca Andrade Tavares Brito Sales Peixoto Queiroz Bezerra'.split(' '),
    },
    de: {
        p: 'Lukas Leon Jonas Felix Maximilian Niklas Tim Jan Paul Finn Luca Moritz Julian Tobias Florian Kevin Marco Dennis Patrick Sebastian Timo Nico David Philipp Fabian Marvin Robin Yannik Erik Ben Elias Noah Tom Lennart Emre'.split(' '),
        s: 'Müller Schmidt Schneider Fischer Weber Meyer Wagner Becker Schulz Hoffmann Koch Richter Klein Wolf Schröder Neumann Schwarz Braun Zimmermann Krüger Hartmann Lange Werner Krause Lehmann Köhler Maier Kaiser Fuchs Vogel Brandt Engel Kühn Pohl Sommer Seidel Arslan Yılmaz Kaya Demir'.split(' '),
    },
    en: {
        p: 'James Jack Harry Oliver Charlie George Thomas Joe Callum Lewis Ryan Jordan Connor Kyle Liam Jake Ben Sam Luke Josh Dan Tom Alfie Archie Mason Reece Kieran Jamie Nathan Owen Tyrese Marcus Kai Ethan Leon'.split(' '),
        s: 'Smith Jones Taylor Brown Williams Wilson Johnson Davies Robinson Wright Thompson Evans Walker White Roberts Green Hall Wood Jackson Clarke Hughes Edwards Turner Cooper Hill Ward Morris Moore Clark Baker Harrison Morgan Patel Kelly Murphy Bennett Barnes Okafor Mensah Campbell'.split(' '),
    },
    fr: {
        p: 'Lucas Hugo Théo Nathan Mathis Enzo Louis Maxime Thomas Antoine Yanis Rayan Ibrahima Moussa Mamadou Clément Baptiste Quentin Alexis Bastien Florian Romain Adrien Jordan Ismaël Sofiane Bilal Malik Axel Killian'.split(' '),
        s: 'Martin Bernard Dubois Thomas Robert Richard Petit Durand Leroy Moreau Simon Laurent Lefebvre Michel Garcia David Bertrand Roux Vincent Fournier Morel Girard André Mercier Blanc Guérin Diallo Traoré Koné Camara Sissoko Cissé Diop Fofana Mendy Bakayoko Benali Haddad'.split(' '),
    },
    es: {
        p: 'Pablo Álvaro Sergio Javier Daniel Adrián David Carlos Alejandro Iker Hugo Mario Raúl Rubén Marcos Iván Jorge Diego Óscar Víctor Unai Aitor Jon Mikel Asier Borja Nacho Dani Antonio Manuel'.split(' '),
        s: 'García Fernández González Rodríguez López Martínez Sánchez Pérez Gómez Martín Jiménez Ruiz Hernández Díaz Moreno Muñoz Álvarez Romero Alonso Gutiérrez Navarro Torres Domínguez Vázquez Ramos Gil Serrano Blanco Molina Ortega Delgado Castro Ortiz Rubio Marín Iglesias Garrido Etxeberria Aguirre Zubeldia'.split(' '),
    },
    it: {
        p: 'Francesco Alessandro Lorenzo Andrea Matteo Gabriele Riccardo Tommaso Davide Federico Luca Marco Simone Stefano Nicolò Giacomo Filippo Pietro Daniele Antonio Giuseppe Salvatore Mattia Edoardo Emanuele Alessio Christian Michele Gianluca Fabio'.split(' '),
        s: 'Rossi Russo Ferrari Esposito Bianchi Romano Colombo Ricci Marino Greco Bruno Gallo Conti De Luca Mancini Costa Giordano Rizzo Lombardi Moretti Barbieri Fontana Santoro Mariani Rinaldi Caruso Ferrara Galli Martini Leone Longo Gentile Martinelli Vitale Serra Coppola De Santis Marchetti Parisi Villa'.split(' '),
    },
    nl: {
        p: 'Daan Sem Lucas Milan Levi Luuk Thijs Jesse Bram Lars Tim Ruben Stijn Sven Jan Kevin Dennis Joey Bart Niels Rick Wout Jordy Mats Thomas Koen Jayden Xavi Quinten Owen'.split(' '),
        s: 'de Jong|Jansen|de Vries|van den Berg|van Dijk|Bakker|Janssen|Visser|Smit|Meijer|de Boer|Mulder|de Groot|Bos|Vos|Peters|Hendriks|van Leeuwen|Dekker|Brouwer|de Wit|Dijkstra|Smits|de Graaf|van der Meer|van der Linden|Kok|Jacobs|de Haan|Vermeulen|van den Heuvel|van der Veen|Kuipers|Schouten|Willems|Hoekstra|Koster|Prins|Blom|Huisman'.split('|'),
    },
    ar: {
        p: 'Santiago Mateo Juan Thiago Lautaro Facundo Nicolás Agustín Franco Matías Gonzalo Joaquín Tomás Lucas Ignacio Federico Maximiliano Ezequiel Leandro Emiliano Cristian Brian Gastón Lisandro Rodrigo Valentín Bruno Alan Exequiel Kevin'.split(' '),
        s: 'González Rodríguez Gómez Fernández López Díaz Martínez Pérez Romero Sosa Álvarez Torres Ruiz Ramírez Flores Benítez Acosta Medina Herrera Suárez Aguirre Giménez Gutiérrez Pereyra Molina Castro Ortiz Silva Núñez Luna Juárez Cabrera Ríos Morales Godoy Ledesma Vega Correa Paz Barrios'.split(' '),
    },
};

// Nomes para pessoas da vida (namorada, filhos etc.)
const NOMES_PESSOAS = {
    f: 'Ana Maria Júlia Beatriz Larissa Camila Fernanda Gabriela Isabela Letícia Mariana Rafaela Sofia Valentina Laura Helena Alice Manuela Lívia Giovanna Bianca Carolina Amanda Bruna Natália Vitória Clara Luiza Yasmin Emily'.split(' '),
    m: 'Miguel Arthur Heitor Theo Davi Gabriel Bernardo Samuel Pedro Lorenzo Benjamin Matheus Lucas Nicolas Joaquim Gael Rafael Enzo Henrique Murilo Bento Vicente Isaac Leonardo Antônio'.split(' '),
};

const Nomes = {
    gerar(cod = 'br') {
        // Em ligas grandes aparecem estrangeiros de vez em quando
        if (Math.random() < 0.12) cod = U.escolha(Object.keys(NOMES));
        const pool = NOMES[cod] || NOMES.br;
        // No Brasil é comum jogador ser conhecido por um nome só
        if (cod === 'br' && Math.random() < 0.18) {
            return U.escolha(pool.p) + ' ' + U.escolha(['Jr.', 'Paulista', 'Baiano', 'Mineiro', 'Gaúcho', 'Carioca', 'Neto', 'Filho']);
        }
        return U.escolha(pool.p) + ' ' + U.escolha(pool.s);
    },
    pessoa(sexo) {
        return U.escolha(NOMES_PESSOAS[sexo] || NOMES_PESSOAS.f);
    },
};
