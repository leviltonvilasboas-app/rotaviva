/* ============================================================
   COORDENADAS PARA O MAPA (Leaflet + OpenStreetMap)
   Lat/Lng dos destinos de pernoite (por id de etapa) e das
   principais paradas. Usadas para desenhar a rota e os marcadores.
   ============================================================ */

const COORD_DESTINOS = {
  "D1":  [-22.1256, -51.3889],  // Presidente Prudente - SP
  "D2":  [-26.4036, -54.6386],  // Eldorado - AR (Misiones)
  "D3":  [-26.7852, -60.4388],  // Pcia. Roque Sáenz Peña - AR
  "D4":  [-27.4936, -64.8597],  // Termas de Río Hondo - AR
  "D5":  [-24.7859, -65.4117],  // Salta - AR
  "D6":  [-23.7450, -65.5000],  // Purmamarca - AR
  "D7":  [-22.9087, -68.1997],  // San Pedro de Atacama - CH
  "D9":  [-23.6509, -70.3975],  // Antofagasta - CH
  "D10": [-22.4544, -68.9294],  // Calama - CH
  "D11": [-23.5770, -65.3936],  // Tilcara - AR
  "D12": [-26.7852, -60.4388],  // Pcia. Roque Sáenz Peña - AR
  "D13": [-25.5972, -54.5786],  // Puerto Iguazú - AR
  "D14": [-23.4253, -51.9386],  // Maringá - PR
  "D15": [-18.4192, -49.2156],  // Itumbiara - GO
  "D16": [-15.7939, -47.8828]   // Brasília - DF
};

// Ponto de origem (casa) para fechar o traçado no início
const COORD_ORIGEM = [-15.7939, -47.8828]; // Brasília - DF

// Coordenadas de paradas/pontos de interesse conhecidos (por nome aproximado)
const COORD_PARADAS = {
  "Garganta del Diablo (Q. de las Conchas)": [-25.9289, -65.7686],
  "El Anfiteatro": [-25.9222, -65.7622],
  "Cerro de los Siete Colores": [-23.7447, -65.4986],
  "Salinas Grandes": [-23.6260, -65.9000],
  "Cuesta de Lipán (mirante)": [-23.6500, -65.6833],
  "Susques (abastecer cheio)": [-23.4050, -66.3686],
  "Paso de Jama (fronteira)": [-23.2333, -67.0333],
  "Valle de la Luna (pôr do sol)": [-22.9167, -68.2833],
  "Géiseres del Tatio (madrugada)": [-22.3333, -68.0167],
  "Lagunas Altiplánicas + Piedras Rojas": [-23.7500, -67.6000],
  "Monumento Natural La Portada": [-23.5083, -70.4100],
  "Paso de Jama (fronteira, sentido CH→AR)": [-23.2333, -67.0333],
  "Pucará de Tilcara": [-23.5806, -65.3931],
  "Serranía de Hornocal (14 Colores)": [-23.1500, -65.2500],
  "Parque Nacional Iguazú (dia inteiro)": [-25.6953, -54.4367],
  "Garganta del Diablo": [-25.6906, -54.4442],
  "Minas de Wanda": [-25.9697, -54.5633]
};
