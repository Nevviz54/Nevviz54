'use strict';
// =====================================================================
//  CLÁSSICOS — rivalidades que deixam o jogo mais quente
//  (moral, diretoria e fama pesam mais nesses jogos)
// =====================================================================
DADOS.rivais = [
    // Brasil
    ['Flamengo', 'Fluminense'], ['Flamengo', 'Vasco'], ['Flamengo', 'Botafogo'], ['Fluminense', 'Vasco'],
    ['Fluminense', 'Botafogo'], ['Vasco', 'Botafogo'], ['Palmeiras', 'Corinthians'], ['Palmeiras', 'São Paulo'],
    ['Palmeiras', 'Santos'], ['Corinthians', 'São Paulo'], ['Corinthians', 'Santos'], ['São Paulo', 'Santos'],
    ['Grêmio', 'Internacional'], ['Cruzeiro', 'Atlético-MG'], ['Bahia', 'Vitória'], ['Athletico-PR', 'Coritiba'],
    ['Sport', 'Náutico'], ['Sport', 'Santa Cruz'], ['Náutico', 'Santa Cruz'], ['Ceará', 'Fortaleza'],
    ['Remo', 'Paysandu'], ['Goiás', 'Vila Nova'], ['Goiás', 'Atlético-GO'], ['Ponte Preta', 'Guarani'],
    ['Avaí', 'Figueirense'], ['CRB', 'CSA'], ['Juventude', 'Caxias'], ['ABC', 'América-RN'],
    // Inglaterra
    ['Liverpool', 'Everton'], ['Liverpool', 'Manchester United'], ['Manchester City', 'Manchester United'],
    ['Arsenal', 'Tottenham'], ['Arsenal', 'Chelsea'], ['Chelsea', 'Tottenham'], ['Newcastle', 'Sunderland'],
    ['Aston Villa', 'Birmingham City'], ['West Ham', 'Millwall'], ['Leeds United', 'Manchester United'],
    ['Nottingham Forest', 'Derby County'], ['Sheffield United', 'Sheffield Wednesday'], ['Southampton', 'Portsmouth'],
    ['Bristol City', 'Bristol Rovers'], ['Brighton', 'Crystal Palace'], ['Wolverhampton', 'West Bromwich'],
    ['Norwich City', 'Ipswich Town'], ['Stoke City', 'Port Vale'], ['Cardiff City', 'Swansea City'],
    ['Blackburn Rovers', 'Burnley'], ['Preston North End', 'Blackpool'],
    // Espanha
    ['Real Madrid', 'Barcelona'], ['Real Madrid', 'Atlético de Madrid'], ['Barcelona', 'Espanyol'],
    ['Sevilla', 'Real Betis'], ['Athletic Club', 'Real Sociedad'], ['Valencia', 'Villarreal'],
    ['Celta de Vigo', 'Deportivo La Coruña'], ['Real Oviedo', 'Sporting Gijón'], 
    // Itália
    ['Inter de Milão', 'Milan'], ['Roma', 'Lazio'], ['Juventus', 'Torino'], ['Juventus', 'Inter de Milão'],
    ['Genoa', 'Sampdoria'], ['Napoli', 'Roma'], ['Fiorentina', 'Juventus'], ['Bologna', 'Fiorentina'],
    // Alemanha
    ['Borussia Dortmund', 'Schalke 04'], ['Bayern de Munique', 'Borussia Dortmund'], ['Hamburger SV', 'Werder Bremen'],
    ['Köln', 'Borussia M\'gladbach'], ['Hamburger SV', 'St. Pauli'], ['Union Berlin', 'Hertha BSC'],
    ['Stuttgart', 'Karlsruher SC'], ['Nürnberg', 'Greuther Fürth'], ['Hannover 96', 'Eintracht Braunschweig'],
    // França
    ['Olympique de Marseille', 'Paris Saint-Germain'], ['Lyon', 'Saint-Étienne'], ['Lille', 'Lens'],
    ['Nice', 'Monaco'], ['Rennes', 'Nantes'], ['Lyon', 'Olympique de Marseille'],
    // Holanda
    ['Ajax', 'Feyenoord'], ['Ajax', 'PSV'], ['PSV', 'Feyenoord'], ['Twente', 'Heracles'],
    ['Groningen', 'Heerenveen'], ['Utrecht', 'Ajax'], ['NAC Breda', 'Willem II'],
    // Argentina
    ['Boca Juniors', 'River Plate'], ['Racing Club', 'Independiente'], ['Rosario Central', 'Newell\'s Old Boys'],
    ['Estudiantes', 'Gimnasia La Plata'], ['San Lorenzo', 'Huracán'], ['Talleres', 'Belgrano'],
    ['Banfield', 'Lanús'], ['Vélez Sarsfield', 'Ferro Carril Oeste'], ['Godoy Cruz', 'Independiente Rivadavia'],
    ['Atlético Tucumán', 'San Martín de Tucumán'], ['Gimnasia de Mendoza', 'Independiente Rivadavia'],
    // México
    ['América', 'Chivas'], ['América', 'Cruz Azul'], ['América', 'Pumas'], ['Cruz Azul', 'Pumas'],
    ['Monterrey', 'Tigres'], ['Chivas', 'Atlas'], ['Chivas', 'Cruz Azul'], ['Toluca', 'América'], ['Puebla', 'Atlante'],
    // Estados Unidos e Canadá (MLS)
    ['LA Galaxy', 'LAFC'], ['Seattle Sounders', 'Portland Timbers'], ['Seattle Sounders', 'Vancouver Whitecaps'],
    ['Portland Timbers', 'Vancouver Whitecaps'], ['New York Red Bulls', 'New York City FC'], ['Inter Miami', 'Orlando City'],
    ['Houston Dynamo', 'FC Dallas'], ['Austin FC', 'FC Dallas'], ['Toronto FC', 'CF Montréal'], ['D.C. United', 'New York Red Bulls'],
    ['Columbus Crew', 'FC Cincinnati'], ['Atlanta United', 'Orlando City'], ['Atlanta United', 'Charlotte FC'],
    ['Sporting Kansas City', 'St. Louis City'], ['Colorado Rapids', 'Real Salt Lake'], ['LAFC', 'San Diego FC'],
    // Seleções
    ['Brasil', 'Argentina'], ['Brasil', 'Uruguai'], ['Argentina', 'Uruguai'], ['Argentina', 'Inglaterra'], ['Inglaterra', 'Alemanha'],
    ['Alemanha', 'Holanda'], ['Inglaterra', 'Escócia'], ['Espanha', 'Portugal'], ['França', 'Itália'], ['México', 'Estados Unidos'],
    ['Japão', 'Coreia do Sul'], ['Marrocos', 'Argélia'], ['Egito', 'Argélia'], ['Croácia', 'Sérvia'], ['Brasil', 'França'],
];
