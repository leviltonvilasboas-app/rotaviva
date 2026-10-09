/* ============================================================
   DADOS DA VIAGEM — PROJETO ATACAMA 2027
   Fonte: documento consolidado (roteiro, hospedagens, orçamento).
   Estes são os dados "de fábrica". O app copia para o localStorage
   na primeira abertura; a partir daí o usuário edita livremente.
   ============================================================ */

const DADOS_FABRICA = {
  versao: 1,
  viagem: {
    titulo: "Expedição Atacama 2027",
    origem: "Brasília – DF",
    destinoPrincipal: "San Pedro de Atacama – Chile",
    moto: "Royal Enfield Super Meteor 650",
    consumoPlanejado: 18,          // km/l
    cambioUSD_BRL: 5.40,
    orcamentoTotal: 10550,         // R$ (estimado 2027)
    dataInicio: "2027-10-02",
    dataFim: "2027-10-17"
  },

  /* ---------- ROTEIRO DIA A DIA ----------
     Cada etapa tem: dia, data, origem, destino, km, pais,
     clima (texto curto), insights (lista) e paradas (pontos de
     interesse editáveis ao longo da rota, antes do destino). */
  etapas: [
    {
      id: "D1", dia: "D1", data: "2027-10-02",
      origem: "Casa (Brasília – DF)", destino: "Presidente Prudente – SP",
      km: 967, pais: "BR", tipo: "Pernoite / traslado",
      hotel: "Apartamento (Airbnb)", hotelValor: 162,
      nascerPor: "06:05 / 18:24",
      clima: "Quente, pancadas de chuva ao fim da tarde. Máx. ~30–32 °C.",
      insights: [
        "Etapa longa de traslado — saia cedo e priorize descanso.",
        "Dia seguinte cruza a fronteira: deixe documentos à mão."
      ],
      paradas: []
    },
    {
      id: "D2", dia: "D2", data: "2027-10-03",
      origem: "Presidente Prudente – SP", destino: "Eldorado – AR",
      km: 686, pais: "BR", tipo: "Pernoite",
      hotel: "Residencial Villalobos", hotelValor: 127,
      nascerPor: "06:16 / 18:39",
      clima: "Subtropical úmido, quente (máx. ~28–30 °C), chuva possível.",
      insights: [
        "Travessia Brasil → Argentina: conferir admissão temporária da moto e Carta Verde.",
        "Região de selva missioneira; porta de entrada para as Cataratas (visita na volta, D13)."
      ],
      paradas: []
    },
    {
      id: "D3", dia: "D3", data: "2027-10-04",
      origem: "Eldorado – AR", destino: "Presidencia Roque Sáenz Peña – AR",
      km: 696, pais: "AR", tipo: "Pernoite",
      hotel: "Chalé Loma Linda (Airbnb)", hotelValor: 226,
      nascerPor: "06:36 / 19:04",
      clima: "Chaco: região mais quente da Argentina. Máx. 33–35 °C, seco.",
      insights: [
        "Nó logístico do Chaco (usado na ida e na volta).",
        "Cidade termal: Complejo Termal e Parque Zooxótico.",
        "Hidrate-se bem; evite as horas centrais na estrada."
      ],
      paradas: []
    },
    {
      id: "D4", dia: "D4", data: "2027-10-05",
      origem: "P. R. Sáenz Peña – AR", destino: "Termas de Río Hondo – AR",
      km: 515, pais: "AR", tipo: "Pernoite",
      hotel: "TERRA-BARRIO NORTE", hotelValor: 180,
      nascerPor: "06:54 / 19:21",
      clima: "Quente e seco, máx. ~31–33 °C; noites agradáveis.",
      insights: [
        "Principal centro termal da Argentina — a cidade inteira tem água termal.",
        "Autódromo Termas de Río Hondo (MotoGP) — parada obrigatória para fãs de moto.",
        "Aproveite a terma à noite para recuperar o corpo após ~500 km."
      ],
      paradas: []
    },
    {
      id: "D5", dia: "D5", data: "2027-10-06",
      origem: "Termas de Río Hondo – AR", destino: "Cafayate / Salta – AR",
      km: 465, pais: "AR", tipo: "Pernoite • REVISÃO DA MOTO",
      hotel: "Hotel Patios de Salta", hotelValor: 135,
      nascerPor: "06:58 / 19:25",
      clima: "Primavera agradável, máx. ~26–28 °C, baixa chuva.",
      insights: [
        "Ruta 68 / Quebrada de las Conchas: uma das estradas mais cênicas do NO argentino.",
        "Cafayate: vinho de altitude (Torrontés) e sorvete de vinho.",
        "Salta: centro histórico, Teleférico Cerro San Bernardo, Museo MAAM.",
        "Fazer a revisão da moto em Salta (cidade grande, com assistência)."
      ],
      paradas: [
        { nome: "Garganta del Diablo (Q. de las Conchas)", feito: false },
        { nome: "El Anfiteatro", feito: false },
        { nome: "Los Castillos / El Sapo / La Yesera", feito: false }
      ]
    },
    {
      id: "D6", dia: "D6", data: "2027-10-07",
      origem: "Salta – AR", destino: "Purmamarca – AR",
      km: 234, pais: "AR", tipo: "Pernoite • início da alta montanha",
      hotel: "Tatas (Airbnb)", hotelValor: 190,
      nascerPor: "06:56 / 19:23",
      clima: "Ensolarado e seco. Máx. ~20–22 °C, noites frias (2–6 °C). ~2.300 m.",
      insights: [
        "Cerro de los Siete Colores — faça o Paseo de los Colorados (melhor ao amanhecer).",
        "Bate-volta cênico: Cuesta de Lipán (RN 52, ~4.170 m) + Salinas Grandes (~3.450 m).",
        "Comece a aclimatação de altitude: hidratação, refeição leve, evitar álcool."
      ],
      paradas: [
        { nome: "Cerro de los Siete Colores", feito: false },
        { nome: "Salinas Grandes", feito: false },
        { nome: "Cuesta de Lipán (mirante)", feito: false }
      ]
    },
    {
      id: "D7", dia: "D7–D8", data: "2027-10-08",
      origem: "Purmamarca – AR", destino: "San Pedro de Atacama – CH",
      km: 411, pais: "AR", tipo: "2 noites • travessia Paso de Jama",
      hotel: "Travel House (2 noites)", hotelValor: 287,
      nascerPor: "07:07 / 19:33",
      clima: "Árido e ensolarado. Povoado (~2.400 m): máx. 22–24 °C, mín. 5–8 °C. Passeios de altitude podem ficar abaixo de 0 °C.",
      insights: [
        "DIA CRÍTICO: Paso de Jama a ~4.200 m (picos ~4.800 m). Confirme a abertura do passo na véspera.",
        "Abasteça CHEIO em Susques antes de subir — trecho isolado.",
        "Fronteira: controle sanitário chileno (SAG) é rigoroso — nada de frutas, carnes, laticínios.",
        "San Pedro (2 dias): Valle de la Luna, Lagunas Altiplánicas + Piedras Rojas, Géiseres del Tatio, Laguna Cejar, astroturismo."
      ],
      paradas: [
        { nome: "Susques (abastecer cheio)", feito: false },
        { nome: "Paso de Jama (fronteira)", feito: false },
        { nome: "Valle de la Luna (pôr do sol)", feito: false },
        { nome: "Géiseres del Tatio (madrugada)", feito: false },
        { nome: "Lagunas Altiplánicas + Piedras Rojas", feito: false }
      ]
    },
    {
      id: "D9", dia: "D9", data: "2027-10-10",
      origem: "San Pedro de Atacama – CH", destino: "Antofagasta – CH",
      km: 444, pais: "CL", tipo: "Pernoite",
      hotel: "Apartamento em Antofagasta (Airbnb)", hotelValor: 247,
      nascerPor: "07:14 / 19:43",
      clima: "Litoral desértico ameno, máx. ~19–21 °C, neblina costeira (camanchaca) pela manhã.",
      insights: [
        "La Portada: arco natural de rocha sobre o mar (~18 km ao norte).",
        "Costanera e Barrio Histórico portuário — bons frutos do mar após o deserto.",
        "Descida da cordilheira ao Pacífico: grande variação de altitude e temperatura."
      ],
      paradas: [
        { nome: "Monumento Natural La Portada", feito: false }
      ]
    },
    {
      id: "D10", dia: "D10", data: "2027-10-11",
      origem: "Antofagasta – CH", destino: "Calama – CH",
      km: 311, pais: "CL", tipo: "Pernoite",
      hotel: "Hostal Ruta Del Desierto", hotelValor: 170,
      nascerPor: "07:08 / 19:37",
      clima: "Desértico, grande amplitude térmica — máx. ~24 °C, noites 5–7 °C.",
      insights: [
        "Principal cidade de serviços do deserto: bancos, oficinas, abastecimento.",
        "Opcional: tour à mina Chuquicamata (agendar com antecedência).",
        "Ponto para checar a moto antes de voltar a cruzar os Andes."
      ],
      paradas: []
    },
    {
      id: "D11", dia: "D11", data: "2027-10-12",
      origem: "Calama – CH", destino: "Tilcara – AR",
      km: 511, pais: "CL", tipo: "Pernoite • retorno via Paso de Jama",
      hotel: "Glamping El Obrador (Airbnb)", hotelValor: 251,
      nascerPor: "06:52 / 19:25",
      clima: "Ensolarado e seco, máx. ~22–24 °C, noites frias (6–9 °C) pela altitude.",
      insights: [
        "Travessia de volta pelo Paso de Jama (sentido Chile → Argentina). Abasteça no lado chileno antes de subir.",
        "Pucará de Tilcara — fortaleza pré-inca (~2.465 m) com jardim botânico de altura.",
        "Garganta del Diablo (Tilcara) — trilha curta até o desfiladeiro.",
        "No caminho: Humahuaca e o mirante dos 14 Colores (Hornocal); Maimará (Paleta del Pintor)."
      ],
      paradas: [
        { nome: "Paso de Jama (fronteira, sentido CH→AR)", feito: false },
        { nome: "Pucará de Tilcara", feito: false },
        { nome: "Serranía de Hornocal (14 Colores)", feito: false }
      ]
    },
    {
      id: "D12", dia: "D12", data: "2027-10-13",
      origem: "Purmamarca – AR", destino: "Presidencia Roque Sáenz Peña – AR",
      km: 746, pais: "AR", tipo: "Pernoite • longo traslado",
      hotel: "Chalé Loma Linda (Airbnb)", hotelValor: 226,
      nascerPor: "06:36 / 19:04",
      clima: "Calor do Chaco retorna (máx. 33–35 °C).",
      insights: [
        "Dia de 'comer estrada' na descida dos Andes rumo ao leste.",
        "Saída cedo, hidratação e atenção à fadiga."
      ],
      paradas: []
    },
    {
      id: "D13", dia: "D13", data: "2027-10-14",
      origem: "P. R. Sáenz Peña – AR", destino: "Puerto Iguazú – AR",
      km: 792, pais: "AR", tipo: "Pernoite • grande final natural",
      hotel: "Suites Palm (Airbnb)", hotelValor: 196,
      nascerPor: "06:04 / 18:44",
      clima: "Subtropical quente e úmido, máx. ~28–30 °C, chuvas possíveis.",
      insights: [
        "Cataratas del Iguazú (lado argentino): reserve um dia inteiro — Garganta del Diablo, Circuitos Superior e Inferior.",
        "Opcional: passeio de barco Gran Aventura.",
        "Leve capa de chuva e proteja os eletrônicos — nas passarelas se molha bastante."
      ],
      paradas: [
        { nome: "Parque Nacional Iguazú (dia inteiro)", feito: false },
        { nome: "Garganta del Diablo", feito: false }
      ]
    },
    {
      id: "D14", dia: "D14", data: "2027-10-15",
      origem: "Colonia Wanda – AR", destino: "Maringá – PR",
      km: 473, pais: "BR", tipo: "Pernoite • REVISÃO DA MOTO",
      hotel: "Quarto Maringá (Airbnb)", hotelValor: 160,
      nascerPor: "05:55 / 18:32",
      clima: "Primavera quente, máx. ~28–30 °C, pancadas de chuva possíveis.",
      insights: [
        "Retorno Argentina → Brasil (Puerto Iguazú / Foz do Iguaçu). Confirmar baixa da admissão temporária.",
        "No caminho: Colonia Wanda (minas de pedras preciosas).",
        "Última cidade grande — fazer a revisão final da moto antes de Brasília.",
        "Catedral de Maringá: uma das mais altas da América do Sul."
      ],
      paradas: [
        { nome: "Minas de Wanda", feito: false }
      ]
    },
    {
      id: "D15", dia: "D15", data: "2027-10-16",
      origem: "Maringá – PR", destino: "Itumbiara – GO",
      km: 754, pais: "BR", tipo: "Pernoite • traslado",
      hotel: "Apartamento no Ibiza (Airbnb)", hotelValor: 130,
      nascerPor: "05:46 / 18:18",
      clima: "Quente, chuvas de primavera do Cerrado (máx. ~30–33 °C).",
      insights: [
        "Cidade às margens do Rio Paranaíba (divisa GO/MG), com a represa de Itumbiara.",
        "Atenção a tempestades de fim de tarde."
      ],
      paradas: []
    },
    {
      id: "D16", dia: "D16", data: "2027-10-17",
      origem: "Itumbiara – GO", destino: "Casa (Brasília – DF)",
      km: 386, pais: "BR", tipo: "Retorno",
      hotel: "—", hotelValor: 0,
      nascerPor: "—",
      clima: "Quente e seco a parcialmente chuvoso, máx. ~30–32 °C.",
      insights: [
        "Última etapa — fechamento do roteiro. Dia mais curto e tranquilo."
      ],
      paradas: []
    }
  ],

  /* ---------- PREÇOS DE COMBUSTÍVEL (R$/L, referência 2025) ---------- */
  combustivel: {
    BR: 6.75, AR: 7.29, CL: 8.53,
    nota: "Preços de referência 2025 (gasolina comum, US$=R$5,40). Reconfirmar antes da viagem."
  },

  /* ---------- CATEGORIAS DE GASTO ---------- */
  categorias: ["Hospedagem", "Combustível", "Alimentação", "Pedágio", "Passeios", "Manutenção", "Outros"],

  /* ---------- CHECKLISTS ---------- */
  checklists: {
    "Documentos & Fronteira": [
      "Passaporte válido",
      "CNH + PID (Permissão Internacional)",
      "CRLV / documento da moto",
      "Carta Verde / seguro Mercosul",
      "Seguro viagem com cobertura médica",
      "Admissão temporária da moto (ida)",
      "Baixa da admissão temporária (volta)"
    ],
    "Dinheiro": [
      "Dólares em espécie (notas novas, mix de valores)",
      "US$ 500–800 em espécie no total",
      "1–2 cartões internacionais (baixo IOF), banco avisado",
      "App de câmbio (peso AR e CLP)",
      "Reserva em reais para o trecho Brasil",
      "Dinheiro dividido em locais diferentes"
    ],
    "Equipamento do piloto": [
      "Capacete", "Jaqueta", "Calça/proteção", "Luvas", "Botas",
      "Capa de chuva", "Camadas térmicas (frio do altiplano)",
      "Proteção solar + labial", "Óculos", "Kit primeiros socorros"
    ],
    "Moto & ferramentas": [
      "Revisão feita (óleo, pneus, freios, corrente)",
      "Kit de reparo de pneus + compressor",
      "Medidor de pressão", "Fusíveis", "Lubrificante de corrente",
      "Lanterna", "Power bank", "Abraçadeiras + fita resistente"
    ]
  }
};
