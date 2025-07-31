// script.js

// Variables globales para los datos
let fullData = []; // Datos completos cargados del CSV
let filteredData = []; // Datos después de aplicar los filtros

// Definición de márgenes y dimensiones para los gráficos SVG
const chartMargin = { top: 20, right: 30, bottom: 40, left: 90 };

// Colores para los niveles de riesgo
const riskColors = {
    "Low": "green",
    "Medium": "orange",
    "High": "red"
};

// --- Carga y preprocesamiento de datos ---
async function loadData() {
    try {
        // Carga el archivo CSV
        const rawData = await d3.csv('data/riesgo_cancer_dataset.csv');

        // Preprocesamiento de datos: convertir tipos, ordenar, etc.
        fullData = rawData.map(d => ({
            id: +d.id,
            age: +d.age,
            bmi: +d.bmi,
            smoker: d.smoker,
            alcohol_consumption: d.alcohol_consumption,
            diet_type: d.diet_type,
            physical_activity_level: d.physical_activity_level,
            family_history: d.family_history,
            mental_stress_level: d.mental_stress_level,
            sleep_hours: +d.sleep_hours, // Convertir a número
            regular_health_checkup: d.regular_health_checkup,
            prostate_exam_done: d.prostate_exam_done,
            risk_level: d.risk_level
        }));

        // Inicializa los datos filtrados con los datos completos
        filteredData = [...fullData];
        console.log("Datos cargados y filtrados inicialmente:", filteredData.length, "registros.");

        // Dibuja todas las visualizaciones por primera vez
        updateDashboard();

    } catch (error) {
        console.error('Error al cargar o procesar el conjunto de datos:', error);
        alert('No se pudo cargar el archivo de datos. Asegúrate de que "riesgo_cancer_dataset.csv" esté en la carpeta "data".');
    }
}

// Función de inicialización al cargar el DOM
document.addEventListener('DOMContentLoaded', function() {
    loadData();
    setupFilters();
    setupProfileControls(); // Para el panel exploratorio
});


// --- Funciones de filtrado ---
function applyFilters() {
    let currentData = [...fullData]; // Siempre parte de los datos completos

    // Filtro de Edad (Slider)
    const minAge = parseInt(d3.select('#age-slider').property('value'));
    d3.select('#age-value').text(`${minAge}+`);
    currentData = currentData.filter(d => d.age >= minAge);

    // Filtros de Selectores (ejemplo para Actividad Física)
    const selectedActivity = d3.select('#activity-select').property('value');
    if (selectedActivity !== 'All') {
        currentData = currentData.filter(d => d.physical_activity_level === selectedActivity);
    }

    const selectedSmoker = d3.select('#smoker-select').property('value');
    if (selectedSmoker !== 'All') {
        currentData = currentData.filter(d => d.smoker === selectedSmoker);
    }

    const selectedAlcohol = d3.select('#alcohol-select').property('value');
    if (selectedAlcohol !== 'All') {
        currentData = currentData.filter(d => d.alcohol_consumption === selectedAlcohol);
    }

    const selectedDiet = d3.select('#diet-select').property('value');
    if (selectedDiet !== 'All') {
        currentData = currentData.filter(d => d.diet_type === selectedDiet);
    }

    const selectedCheckup = d3.select('#checkup-select').property('value');
    if (selectedCheckup !== 'All') {
        currentData = currentData.filter(d => d.regular_health_checkup === selectedCheckup);
    }

    const selectedStress = d3.select('#stress-select').property('value');
    if (selectedStress !== 'All') {
        currentData = currentData.filter(d => d.mental_stress_level === selectedStress);
    }

    filteredData = currentData; // Actualiza los datos filtrados
    console.log("Datos filtrados después de aplicar filtros:", filteredData.length, "registros.");
    updateDashboard(); // Redibuja el dashboard con los nuevos datos
}

function setupFilters() {
    // Escucha eventos de cambio en todos los filtros
    d3.select('#age-slider').on('input', applyFilters); // 'input' para actualización en tiempo real
    d3.select('#activity-select').on('change', applyFilters);
    d3.select('#smoker-select').on('change', applyFilters);
    d3.select('#alcohol-select').on('change', applyFilters);
    d3.select('#diet-select').on('change', applyFilters);
    d3.select('#checkup-select').on('change', applyFilters);
    d3.select('#stress-select').on('change', applyFilters);

    d3.select('#reset-filters').on('click', resetFilters);
}

function resetFilters() {
    // Restablece los valores de los selectores a "All"
    d3.select('#activity-select').property('value', 'All');
    d3.select('#smoker-select').property('value', 'All');
    d3.select('#alcohol-select').property('value', 'All');
    d3.select('#diet-select').property('value', 'All');
    d3.select('#checkup-select').property('value', 'All');
    d3.select('#stress-select').property('value', 'All');
    
    // Restablece el slider de edad a su valor mínimo y actualiza el texto
    d3.select('#age-slider').property('value', d3.select('#age-slider').attr('min'));
    d3.select('#age-value').text(`${d3.select('#age-slider').attr('min')}+`);

    filteredData = [...fullData]; // Vuelve a los datos completos
    console.log("Filtros reseteados. Datos filtrados:", filteredData.length, "registros.");
    updateDashboard(); // Redibuja
}


// --- Función principal de actualización del dashboard ---
function updateDashboard() {
    if (filteredData.length === 0) {
        console.warn('No hay datos para mostrar con los filtros actuales.');
        d3.selectAll('.kpi-value').text('N/A');
        // Limpiar y mostrar mensaje en todos los contenedores de gráficos
        d3.selectAll('.chart-container').each(function() {
            d3.select(this).select("svg").remove();
            d3.select(this).append("svg")
                .attr("width", d3.select(this).node().getBoundingClientRect().width)
                .attr("height", 300)
                .append("text")
                .attr("x", "50%")
                .attr("y", "50%")
                .attr("text-anchor", "middle")
                .attr("fill", "#999")
                .text("No hay datos para mostrar con los filtros actuales.");
        });
        return;
    }

    // Actualizar KPIs
    updateKPIs(filteredData);

    // Actualizar todas las visualizaciones
    drawAgeRiskChart(filteredData);
    drawBMIRiskScatter(filteredData);
    drawDietActivityRiskBars(filteredData);
    drawHeatmap(filteredData);
    drawCheckupRiskBars(filteredData);
    updateNoCheckupHighRiskKPI(filteredData);
    drawRadarChart(); // Ahora drawRadarChart llamará a calculateAverageProfile sin pasar data
}

// --- 3. Panel de indicadores principales (KPIs) ---
function updateKPIs(data) {
    const totalCount = data.length;

    // Si no hay datos, todos los KPI son N/A
    if (totalCount === 0) {
        d3.select('#kpi-risk-low .kpi-value').text('N/A');
        d3.select('#kpi-risk-medium .kpi-value').text('N/A');
        d3.select('#kpi-risk-high .kpi-value').text('N/A');
        d3.select('#kpi-checkups .kpi-value').text('N/A');
        d3.select('#kpi-avg-age-risk .kpi-value').html('N/A');
        d3.select('#kpi-avg-sleep-risk .kpi-value').html('N/A');
        return;
    }

    // % de riesgo bajo / medio / alto
    const riskCounts = d3.group(data, d => d.risk_level);
    const lowRisk = (riskCounts.get('Low')?.length || 0) / totalCount * 100;
    const mediumRisk = (riskCounts.get('Medium')?.length || 0) / totalCount * 100;
    const highRisk = (riskCounts.get('High')?.length || 0) / totalCount * 100;

    d3.select('#kpi-risk-low .kpi-value').text(`${lowRisk.toFixed(1)}%`);
    d3.select('#kpi-risk-medium .kpi-value').text(`${mediumRisk.toFixed(1)}%`);
    d3.select('#kpi-risk-high .kpi-value').text(`${highRisk.toFixed(1)}%`);

    // % que se hacen chequeos regulares
    const checkupCount = data.filter(d => d.regular_health_checkup === 'Yes').length;
    const checkupPercentage = (checkupCount / totalCount) * 100;
    d3.select('#kpi-checkups .kpi-value').text(`${checkupPercentage.toFixed(1)}%`);

    // Edad promedio en cada nivel de riesgo
    const avgAgeByRisk = Array.from(d3.group(data, d => d.risk_level), ([key, value]) => ({
        risk: key,
        avgAge: d3.mean(value, d => d.age)
    })).sort((a,b) => { // Ordenar por riesgo para consistencia
        if (a.risk === 'Low') return -1;
        if (a.risk === 'High') return 1;
        return 0;
    });
    let avgAgeHtml = '';
    avgAgeByRisk.forEach(item => {
        avgAgeHtml += `<div style="color: ${riskColors[item.risk] || '#333'}">${item.risk}: ${item.avgAge.toFixed(1)}</div>`;
    });
    d3.select('#kpi-avg-age-risk .kpi-value').html(avgAgeHtml || 'N/A');

    // Horas promedio de sueño por nivel de riesgo
    const avgSleepByRisk = Array.from(d3.group(data, d => d.risk_level), ([key, value]) => ({
        risk: key,
        avgSleep: d3.mean(value, d => d.sleep_hours)
    })).sort((a,b) => {
        if (a.risk === 'Low') return -1;
        if (a.risk === 'High') return 1;
        return 0;
    });
    let avgSleepHours = '';
    avgSleepByRisk.forEach(item => {
        avgSleepHours += `<div style="color: ${riskColors[item.risk] || '#333'}">${item.risk}: ${item.avgSleep.toFixed(1)}h</div>`;
    });
    d3.select('#kpi-avg-sleep-risk .kpi-value').html(avgSleepHours || 'N/A');
}

// --- 4. Visualizaciones por secciones temáticas ---

// I. Perfil general de riesgo
function drawAgeRiskChart(data) {
    const container = d3.select("#chart-age-risk");
    container.select("svg").remove(); // Limpiar SVG anterior

    const width = container.node().getBoundingClientRect().width - chartMargin.left - chartMargin.right;
    const height = 300 - chartMargin.top - chartMargin.bottom;

    const svg = container.append("svg")
        .attr("width", width + chartMargin.left + chartMargin.right)
        .attr("height", height + chartMargin.top + chartMargin.bottom)
        .append("g")
        .attr("transform", `translate(${chartMargin.left},${chartMargin.top})`);

    const tooltip = d3.select("#tooltip");

    // Asegurarse de que los datos no estén vacíos
    if (!data || data.length === 0) {
        svg.append("text")
            .attr("x", width / 2)
            .attr("y", height / 2)
            .attr("text-anchor", "middle")
            .attr("fill", "#999")
            .text("No hay datos disponibles para este gráfico.");
        console.warn("drawAgeRiskChart: No hay datos para procesar.");
        return;
    }

    // Definimos los rangos de edad para las "bins" (grupos)
    // Asegurémonos de que el rango de edad cubre el dominio completo de tus datos.
    // Usar fullData para un rango consistente y evitar problemas si filteredData es muy pequeño
    const minAgeOverall = d3.min(fullData, d => d.age); 
    const maxAgeOverall = d3.max(fullData, d => d.age);
    // Genera umbrales dinámicamente, asegurando que cubran todo el rango de edad
    const ageThresholds = d3.range(
        Math.floor(minAgeOverall / 10) * 10, 
        (Math.ceil(maxAgeOverall / 10) * 10) + 10, 
        10
    );

    const ageBins = d3.bin()
        .value(d => d.age) 
        .thresholds(ageThresholds)
        (data); 

    // Transformamos los bins para que sean compatibles con d3.stack()
    const ageRiskCounts = ageBins.map(bin => {
        const obj = { 
            ageRange: `${bin.x0}-${bin.x1 ? bin.x1 - 1 : bin.x0 + 9}`, // Etiqueta del rango de edad (ej: 20-29). Manejo para el último bin.
            x0: bin.x0, 
            total: 0 
        };
        obj.Low = 0;
        obj.Medium = 0;
        obj.High = 0;

        bin.forEach(d => { 
            if (d.risk_level === 'Low') obj.Low++;
            else if (d.risk_level === 'Medium') obj.Medium++;
            else if (d.risk_level === 'High') obj.High++;
            obj.total++; 
        });
        return obj;
    }).filter(d => d.total > 0) // Filtramos rangos de edad sin datos
      .sort((a, b) => a.x0 - b.x0); // Asegurarse de que los rangos estén ordenados

    // Log para depuración: verifica los datos procesados antes de apilar
    console.log("drawAgeRiskChart - Age Risk Counts for Stacked Bar Chart:", ageRiskCounts);

    // Si ageRiskCounts está vacío después del filtrado, salir
    if (ageRiskCounts.length === 0) {
        svg.append("text")
            .attr("x", width / 2)
            .attr("y", height / 2)
            .attr("text-anchor", "middle")
            .attr("fill", "#999")
            .text("No hay datos válidos para generar rangos de edad.");
        console.warn("drawAgeRiskChart: ageRiskCounts está vacío, no se puede dibujar el gráfico.");
        return;
    }

    // Definimos el "stacker" de D3
    const stack = d3.stack()
        .keys(['Low', 'Medium', 'High']) 
        .order(d3.stackOrderNone) 
        .offset(d3.stackOffsetNone); 
    
    const series = stack(ageRiskCounts);

    // Log para depuración: verifica las series apiladas
    console.log("drawAgeRiskChart - Stacked Series:", series);

    // Escalas
    const x = d3.scaleBand()
        .domain(ageRiskCounts.map(d => d.ageRange))
        .range([0, width])
        .padding(0.1);

    const y = d3.scaleLinear()
        .domain([0, d3.max(ageRiskCounts, d => d.total)]).nice() 
        .range([height, 0]);

    const color = d3.scaleOrdinal()
        .domain(['Low', 'Medium', 'High'])
        .range([riskColors.Low, riskColors.Medium, riskColors.High]);

    // Ejes
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x));

    svg.append("g")
        .call(d3.axisLeft(y));

    // Barras
    svg.append("g")
        .selectAll("g")
        .data(series)
        .join("g")
        .attr("fill", d => color(d.key))
        .selectAll("rect")
        .data(d => d)
        .join("rect")
            .attr("x", d => x(d.data.ageRange))
            .attr("y", d => y(d[1]))
            .attr("height", d => y(d[0]) - y(d[1]))
            .attr("width", x.bandwidth())
            .on("mouseover", function(event, d) {
                tooltip.transition()
                    .duration(200)
                    .style("opacity", .9);
                tooltip.html(`
                    Rango: ${d.data.ageRange} años<br>
                    Riesgo: <span style="color: ${color(d.series.key)};">${d.series.key}</span><br>
                    Personas: ${d[1] - d[0]}
                `)
                .style("left", (event.pageX + 10) + "px") 
                .style("top", (event.pageY - 28) + "px");
            })
            .on("mouseout", function(event, d) {
                tooltip.transition()
                    .duration(500)
                    .style("opacity", 0); 
            });
    
    // Leyenda
    const legend = svg.append("g")
        .attr("font-family", "sans-serif")
        .attr("font-size", 10)
        .attr("text-anchor", "end")
        .selectAll("g")
        .data(['Low', 'Medium', 'High'].slice().reverse()) 
        .join("g")
        .attr("transform", (d, i) => `translate(0,${i * 20})`);

    legend.append("rect")
        .attr("x", width - 19)
        .attr("width", 19)
        .attr("height", 19)
        .attr("fill", color);

    legend.append("text")
        .attr("x", width - 24)
        .attr("y", 9.5)
        .attr("dy", "0.32em")
        .text(d => d);
}

function drawBMIRiskScatter(data) {
    const container = d3.select("#chart-bmi-risk");
    container.select("svg").remove();

    const width = container.node().getBoundingClientRect().width - chartMargin.left - chartMargin.right;
    const height = 300 - chartMargin.top - chartMargin.bottom;

    const svg = container.append("svg")
        .attr("width", width + chartMargin.left + chartMargin.right)
        .attr("height", height + chartMargin.top + chartMargin.bottom)
        .append("g")
        .attr("transform", `translate(${chartMargin.left},${chartMargin.top})`);
    const tooltip = d3.select("#tooltip");

    if (!data || data.length === 0) {
        svg.append("text")
            .attr("x", width / 2)
            .attr("y", height / 2)
            .attr("text-anchor", "middle")
            .attr("fill", "#999")
            .text("No hay datos disponibles para este gráfico.");
        return;
    }
    
    // Escalas
    const x = d3.scaleLinear()
        .domain(d3.extent(data, d => d.bmi)).nice()
        .range([0, width]);

    const y = d3.scaleLinear()
        .domain([0, 2]).nice() // Mapear Low/Medium/High a numérico 0, 1, 2
        .range([height, 0]);

    const size = d3.scaleLinear()
        .domain(d3.extent(data, d => d.sleep_hours)).nice()
        .range([4, 15]); // Rango de tamaño de los puntos

    const riskLevelNames = ['Low', 'Medium', 'High'];
    const yAxisTicks = riskLevelNames.map((d, i) => i);

    // Ejes
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x).ticks(5))
        .append("text")
        .attr("x", width / 2)
        .attr("y", 35)
        .attr("fill", "black")
        .text("IMC");

    svg.append("g")
        .call(d3.axisLeft(y).tickValues(yAxisTicks).tickFormat(i => riskLevelNames[i]))
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", -chartMargin.left + 20)
        .attr("x", -height / 2)
        .attr("fill", "black")
        .attr("text-anchor", "middle")
        .text("Nivel de Riesgo");

    // Puntos de dispersión
    svg.selectAll("circle")
        .data(data)
        .join("circle")
        .attr("cx", d => x(d.bmi))
        .attr("cy", d => y(riskLevelNames.indexOf(d.risk_level)))
        .attr("r", d => size(d.sleep_hours))
        .attr("fill", d => riskColors[d.risk_level])
        .attr("opacity", 0.7)

        // --- Eventos para el tooltip ---
        .on("mouseover", function(event, d) {
            tooltip.transition()
                .duration(200)
                .style("opacity", .9);
            tooltip.html(`
                Edad: ${d.age}<br>
                IMC: ${d.bmi.toFixed(1)}<br>
                Riesgo: <span style="color: ${riskColors[d.risk_level]};">${d.risk_level}</span><br>
                Sueño: ${d.sleep_hours.toFixed(1)}h
            `)
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function(event, d) {
            tooltip.transition()
                .duration(500)
                .style("opacity", 0);
        });
}

// II. Estilo de vida y hábitos
function drawDietActivityRiskBars(data) {
    const container = d3.select("#chart-diet-activity-risk");
    container.select("svg").remove();

    const width = container.node().getBoundingClientRect().width - chartMargin.left - chartMargin.right;
    const height = 300 - chartMargin.top - chartMargin.bottom;

    const svg = container.append("svg")
        .attr("width", width + chartMargin.left + chartMargin.right)
        .attr("height", height + chartMargin.top + chartMargin.bottom)
        .append("g")
        .attr("transform", `translate(${chartMargin.left},${chartMargin.top})`);
    const tooltip = d3.select("#tooltip");

    // 1. Verificación inicial de datos de entrada
    if (!data || data.length === 0) {
        svg.append("text")
            .attr("x", width / 2)
            .attr("y", height / 2)
            .attr("text-anchor", "middle")
            .attr("fill", "#999")
            .text("No hay datos disponibles para este gráfico.");
        console.warn("drawDietActivityRiskBars: No hay datos para procesar.");
        return;
    }

    // Definir las claves de riesgo para asegurar consistencia
    const riskKeys = ['Low', 'Medium', 'High'];

    // Agrupar datos por Dieta y Riesgo
    const dietRiskData = Array.from(d3.group(data, d => d.diet_type), // Primero agrupar por dieta
        ([diet, dietGroup]) => {
            const obj = { diet: diet, total: 0 };
            riskKeys.forEach(key => obj[key] = 0); // Inicializar todos los niveles de riesgo a 0

            // Luego, dentro de cada grupo de dieta, agrupar por riesgo
            const risksMap = d3.group(dietGroup, d => d.risk_level);
            risksMap.forEach((values, risk) => {
                if (obj.hasOwnProperty(risk)) { 
                    obj[risk] = values.length;
                }
            });
            obj.total = d3.sum(riskKeys, key => obj[key]); // Sumar todos los conteos para el total
            return obj;
        }).sort((a,b) => {
            const order = {'Fatty': 0, 'Mixed': 1, 'Healthy': 2};
            return order[a.diet] - order[b.diet];
        });
    
    console.log("drawDietActivityRiskBars - Diet Risk Data:", dietRiskData);


    // Agrupar datos por Actividad Física y Riesgo
    const activityRiskData = Array.from(d3.group(data, d => d.physical_activity_level), // Primero agrupar por actividad
        ([activity, activityGroup]) => {
            const obj = { activity: activity, total: 0 };
            riskKeys.forEach(key => obj[key] = 0); // Inicializar todos los niveles de riesgo a 0

            // Luego, dentro de cada grupo de actividad, agrupar por riesgo
            const risksMap = d3.group(activityGroup, d => d.risk_level);
            risksMap.forEach((values, risk) => {
                if (obj.hasOwnProperty(risk)) {
                    obj[risk] = values.length;
                }
            });
            obj.total = d3.sum(riskKeys, key => obj[key]); // Sumar todos los conteos para el total
            return obj;
        }).sort((a,b) => {
            const order = {'Low': 0, 'Moderate': 1, 'High': 2};
            return order[a.activity] - order[b.activity];
        });

    console.log("drawDietActivityRiskBars - Activity Risk Data:", activityRiskData);

    // 2. Verificación de datos después de la agrupación
    if (dietRiskData.length === 0 && activityRiskData.length === 0) {
        svg.append("text")
            .attr("x", width / 2)
            .attr("y", height / 2)
            .attr("text-anchor", "middle")
            .attr("fill", "#999")
            .text("No se pudieron generar datos para este gráfico con los filtros actuales.");
        console.warn("drawDietActivityRiskBars: dietRiskData y activityRiskData están vacíos.");
        return;
    }


    const keys = ['Low', 'Medium', 'High']; // Definidas explícitamente

    const stackDiet = d3.stack().keys(keys)(dietRiskData);
    const stackActivity = d3.stack().keys(keys)(activityRiskData);

    console.log("drawDietActivityRiskBars - Stacked Diet Series:", stackDiet);
    console.log("drawDietActivityRiskBars - Stacked Activity Series:", stackActivity);

    // Escalas X (diet y activity)
    const xDiet = d3.scaleBand()
        .domain(dietRiskData.map(d => d.diet))
        .range([0, width / 2 - 20])
        .padding(0.1);

    const xActivity = d3.scaleBand()
        .domain(activityRiskData.map(d => d.activity))
        .range([width / 2 + 20, width])
        .padding(0.1);

    // Escala Y (común para ambos)
    const yMaxDiet = d3.max(dietRiskData, d => d.total) || 0;
    const yMaxActivity = d3.max(activityRiskData, d => d.total) || 0;
    const yMaxCombined = Math.max(yMaxDiet, yMaxActivity);
    
    // 3. Verificación del dominio Y
    if (yMaxCombined === 0) {
         svg.append("text")
            .attr("x", width / 2)
            .attr("y", height / 2)
            .attr("text-anchor", "middle")
            .attr("fill", "#999")
            .text("El total de datos para las barras es cero.");
        console.warn("drawDietActivityRiskBars: El dominio Y es cero, no se pueden dibujar las barras.");
        return;
    }

    const y = d3.scaleLinear()
        .domain([0, yMaxCombined]).nice()
        .range([height, 0]);

    const color = d3.scaleOrdinal()
        .domain(keys)
        .range([riskColors.Low, riskColors.Medium, riskColors.High]);

    // Ejes
    // Eje Y (izquierdo, común para ambos)
    svg.append("g")
        .call(d3.axisLeft(y))
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", -chartMargin.left + 20)
        .attr("x", -height / 2)
        .attr("fill", "black")
        .attr("text-anchor", "middle")
        .text("Conteo de Personas");

    // Eje X para Dieta
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(xDiet))
        .append("text")
        .attr("x", xDiet.range()[1] / 2)
        .attr("y", 35)
        .attr("fill", "black")
        .attr("text-anchor", "middle")
        .text("Tipo de Dieta");

    // Eje X para Actividad Física
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(xActivity))
        .append("text")
        .attr("x", xActivity.range()[0] + (xActivity.range()[1] - xActivity.range()[0]) / 2)
        .attr("y", 35)
        .attr("fill", "black")
        .attr("text-anchor", "middle")
        .text("Nivel de Actividad Física");

    // Dibujar barras para Dieta
    svg.append("g")
        .selectAll("g")
        .data(stackDiet)
        .join("g")
        .attr("fill", d => color(d.key))
        .selectAll("rect")
        .data(d => d)
        .join("rect")
            .attr("x", d => xDiet(d.data.diet))
            .attr("y", d => y(d[1]))
            .attr("height", d => y(d[0]) - y(d[1]))
            .attr("width", xDiet.bandwidth())
            .on("mouseover", function(event, d) {
                tooltip.transition().duration(200).style("opacity", .9);
                // Asegurarse de que d.series y d.series.key existan
                const riskLevel = d.series && d.series.key ? d.series.key : 'Desconocido';
                tooltip.html(`
                    Dieta: ${d.data.diet}<br>
                    Riesgo: <span style="color: ${color(riskLevel)};">${riskLevel}</span><br>
                    Personas: ${d[1] - d[0]}
                `)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 28) + "px");
            })
            .on("mouseout", function(event, d) {
                tooltip.transition().duration(500).style("opacity", 0);
            });

    // Dibujar barras para Actividad
    svg.append("g")
        .selectAll("g")
        .data(stackActivity)
        .join("g")
        .attr("fill", d => color(d.key))
        .selectAll("rect")
        .data(d => d)
        .join("rect")
            .attr("x", d => xActivity(d.data.activity))
            .attr("y", d => y(d[1]))
            .attr("height", d => y(d[0]) - y(d[1]))
            .attr("width", xActivity.bandwidth())
            .on("mouseover", function(event, d) {
                tooltip.transition().duration(200).style("opacity", .9);
                // Asegurarse de que d.series y d.series.key existan
                const riskLevel = d.series && d.series.key ? d.series.key : 'Desconocido';
                tooltip.html(`
                    Actividad: ${d.data.activity}<br>
                    Riesgo: <span style="color: ${color(riskLevel)};">${riskLevel}</span><br>
                    Personas: ${d[1] - d[0]}
                `)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 28) + "px");
            })
            .on("mouseout", function(event, d) {
                tooltip.transition().duration(500).style("opacity", 0);
            });

    // Añadir una línea separadora en el medio
    svg.append("line")
        .attr("x1", width / 2)
        .attr("y1", 0)
        .attr("x2", width / 2)
        .attr("y2", height)
        .attr("stroke", "#ccc")
        .attr("stroke-dasharray", "4");

    // Leyenda común
    const legend = svg.append("g")
        .attr("font-family", "sans-serif")
        .attr("font-size", 10)
        .attr("text-anchor", "end")
        .selectAll("g")
        .data(keys.slice().reverse())
        .join("g")
        .attr("transform", (d, i) => `translate(0,${i * 20})`);

    legend.append("rect")
        .attr("x", width - 19)
        .attr("width", 19)
        .attr("height", 19)
        .attr("fill", color);

    legend.append("text")
        .attr("x", width - 24)
        .attr("y", 9.5)
        .attr("dy", "0.32em")
        .text(d => d);
}

function drawHeatmap(data) {
    const container = d3.select("#chart-heatmap");
    container.select("svg").remove();

    const width = container.node().getBoundingClientRect().width - chartMargin.left - chartMargin.right;
    const height = 300 - chartMargin.top - chartMargin.bottom;

    const svg = container.append("svg")
        .attr("width", width + chartMargin.left + chartMargin.right)
        .attr("height", height + chartMargin.top + chartMargin.bottom)
        .append("g")
        .attr("transform", `translate(${chartMargin.left},${chartMargin.top})`);
    
    const tooltip = d3.select("#tooltip");

    if (!data || data.length === 0) {
        svg.append("text")
            .attr("x", width / 2)
            .attr("y", height / 2)
            .attr("text-anchor", "middle")
            .attr("fill", "#999")
            .text("No hay datos disponibles para este gráfico.");
        return;
    }

    // Agrupar datos: Dieta, Estrés y calcular el promedio de riesgo (numérico)
    // Asignamos un valor numérico a los niveles de riesgo: Low=0, Medium=1, High=2
    const riskMap = { 'Low': 0, 'Medium': 1, 'High': 2 };

    const heatmapData = Array.from(d3.group(data, d => d.diet_type, d => d.mental_stress_level), 
        ([diet, stressMap]) => Array.from(stressMap, ([stress, values]) => ({
            diet: diet,
            stress: stress,
            avg_risk: d3.mean(values, d => riskMap[d.risk_level])
        }))).flat();
    
    const xLabels = [...new Set(heatmapData.map(d => d.diet))].sort();
    const yLabels = [...new Set(heatmapData.map(d => d.stress))].sort();

    // Si no hay datos después de la agrupación, salir
    if (heatmapData.length === 0 || xLabels.length === 0 || yLabels.length === 0) {
        svg.append("text")
            .attr("x", width / 2)
            .attr("y", height / 2)
            .attr("text-anchor", "middle")
            .attr("fill", "#999")
            .text("No hay datos válidos para el heatmap.");
        return;
    }


    const x = d3.scaleBand()
        .range([0, width])
        .domain(xLabels)
        .padding(0.05);

    const y = d3.scaleBand()
        .range([height, 0])
        .domain(yLabels)
        .padding(0.05);

    const colorScale = d3.scaleLinear()
        .range(["green", "yellow", "red"]) // Verde para bajo, amarillo para medio, rojo para alto
        .domain([0, 1, 2]); // Mapea los valores numéricos de riesgo

    // Ejes
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x));

    svg.append("g")
        .call(d3.axisLeft(y));

    // Celdas del Heatmap
    svg.selectAll()
        .data(heatmapData, d => d.diet + ':' + d.stress)
        .enter()
        .append("rect")
        .attr("x", d => x(d.diet))
        .attr("y", d => y(d.stress))
        .attr("width", x.bandwidth())
        .attr("height", y.bandwidth())
        .style("fill", d => colorScale(d.avg_risk))
        // --- Eventos para el tooltip ---
        .on("mouseover", function(event, d) {
            tooltip.transition().duration(200).style("opacity", .9);
            tooltip.html(`
                Dieta: ${d.diet}<br>
                Estrés: ${d.stress}<br>
                Riesgo Promedio: ${d.avg_risk.toFixed(2)}
            `)
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function(event, d) {
            tooltip.transition().duration(500).style("opacity", 0);
        });
}


// III. Salud preventiva
function drawCheckupRiskBars(data) {
    const container = d3.select("#chart-checkup-risk");
    container.select("svg").remove();

    const width = container.node().getBoundingClientRect().width - chartMargin.left - chartMargin.right;
    const height = 300 - chartMargin.top - chartMargin.bottom;

    const svg = container.append("svg")
        .attr("width", width + chartMargin.left + chartMargin.right)
        .attr("height", height + chartMargin.top + chartMargin.bottom)
        .append("g")
        .attr("transform", `translate(${chartMargin.left},${chartMargin.top})`);

    const tooltip = d3.select("#tooltip");

    if (!data || data.length === 0) {
        svg.append("text")
            .attr("x", width / 2)
            .attr("y", height / 2)
            .attr("text-anchor", "middle")
            .attr("fill", "#999")
            .text("No hay datos disponibles para este gráfico.");
        return;
    }

    // Agrupar por regular_health_checkup y risk_level
    const checkupData = Array.from(d3.group(data, d => d.regular_health_checkup, d => d.risk_level), 
        ([checkup, riskMap]) => {
            const obj = { checkup: checkup };
            // Asegurarse de que todas las claves de riesgo estén presentes con 0 si no hay datos
            obj.Low = riskMap.has('Low') ? riskMap.get('Low').length : 0;
            obj.Medium = riskMap.has('Medium') ? riskMap.get('Medium').length : 0;
            obj.High = riskMap.has('High') ? riskMap.get('High').length : 0;
            return obj;
        });
    
    // Ordenar para tener "Yes" y "No" consistentes
    checkupData.sort((a, b) => (a.checkup === 'Yes' ? -1 : 1));

    // Si checkupData está vacío, salir
    if (checkupData.length === 0) {
        svg.append("text")
            .attr("x", width / 2)
            .attr("y", height / 2)
            .attr("text-anchor", "middle")
            .attr("fill", "#999")
            .text("No hay datos válidos para los chequeos.");
        return;
    }


    const keys = ['Low', 'Medium', 'High'];

    const stack = d3.stack().keys(keys)(checkupData);

    // Escalas
    const x = d3.scaleBand()
        .domain(checkupData.map(d => d.checkup))
        .range([0, width])
        .padding(0.2);

    const y = d3.scaleLinear()
        // Calcula el máximo total de cada barra apilada para el dominio Y
        .domain([0, d3.max(checkupData, d => (d.Low || 0) + (d.Medium || 0) + (d.High || 0))]).nice()
        .range([height, 0]);

    const color = d3.scaleOrdinal()
        .domain(keys)
        .range([riskColors.Low, riskColors.Medium, riskColors.High]);

    // Ejes
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x));

    svg.append("g")
        .call(d3.axisLeft(y));

    // Barras
    svg.append("g")
        .selectAll("g")
        .data(stack)
        .join("g")
        .attr("fill", d => color(d.key))
        .selectAll("rect")
        .data(d => d)
        .join("rect")
            .attr("x", d => x(d.data.checkup))
            .attr("y", d => y(d[1]))
            .attr("height", d => y(d[0]) - y(d[1]))
            .attr("width", x.bandwidth())
            // --- Eventos para el tooltip ---
            .on("mouseover", function(event, d) {
                tooltip.transition().duration(200).style("opacity", .9);
                tooltip.html(`
                    Chequeo Regular: ${d.data.checkup}<br>
                    Riesgo: <span style="color: ${color(d.series.key)};">${d.series.key}</span><br>
                    Personas: ${d[1] - d[0]}
                `)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 28) + "px");
            })
            .on("mouseout", function(event, d) {
                tooltip.transition().duration(500).style("opacity", 0);
            });
    
    // Leyenda
    const legend = svg.append("g")
        .attr("font-family", "sans-serif")
        .attr("font-size", 10)
        .attr("text-anchor", "end")
        .selectAll("g")
        .data(keys.slice().reverse()) // Invertir para que coincida con el orden de las capas
        .join("g")
        .attr("transform", (d, i) => `translate(0,${i * 20})`);

    legend.append("rect")
        .attr("x", width - 19)
        .attr("width", 19)
        .attr("height", 19)
        .attr("fill", color);

    legend.append("text")
        .attr("x", width - 24)
        .attr("y", 9.5)
        .attr("dy", "0.32em")
        .text(d => d);
}

function updateNoCheckupHighRiskKPI(data) {
    const count = data.filter(d => d.regular_health_checkup === 'No' && d.risk_level === 'High').length;
    d3.select('#kpi-no-checkup-high-risk .kpi-value').text(count);
}


// --- 5. Panel exploratorio final ---

// Funciones para el Radar Chart y el perfil estimado
// --- 5. Panel exploratorio final ---

// Helper para normalizar valores (0-1)
// Asegúrate de que esta función esté definida globalmente o accesible
function normalize(value, min, max) {
    if (max - min === 0) return 0.5; // Evitar división por cero
    return (value - min) / (max - min);
}

// Mapeo de categorías a números (para cálculo de promedios)
const catToNum = {
    physical_activity_level: { 'Low': 0, 'Moderate': 1, 'High': 2 },
    smoker: { 'No': 0, 'Yes': 1 },
    alcohol_consumption: { 'None': 0, 'Moderate': 1, 'High': 2 },
    diet_type: { 'Fatty': 0, 'Mixed': 1, 'Healthy': 2 },
    family_history: { 'No': 0, 'Yes': 1 },
    mental_stress_level: { 'Low': 0, 'Medium': 1, 'High': 2 },
    regular_health_checkup: { 'No': 0, 'Yes': 1 }
};


// Función para calcular el perfil promedio de un nivel de riesgo
function calculateAverageProfile(riskLevel) {
    const filtered = fullData.filter(d => d.risk_level === riskLevel);
    if (filtered.length === 0) {
        console.warn(`calculateAverageProfile: No hay datos para el nivel de riesgo '${riskLevel}'.`);
        return null;
    }

    // Calcular minMax solo si aún no está calculado o si fullData ha cambiado
    // Para asegurar que la normalización es consistente sobre todo el dataset.
    const minMax = {
        age: d3.extent(fullData, d => d.age),
        bmi: d3.extent(fullData, d => d.bmi),
        sleep_hours: d3.extent(fullData, d => d.sleep_hours),
        // Añadir rangos para características categóricas si es necesario normalizarlas
        // Por ahora, se usan los valores numéricos directos de catToNum
        physical_activity_level: [0, 2], // De Low(0) a High(2)
        mental_stress_level: [0, 2],
        alcohol_consumption: [0, 2],
        diet_type: [0, 2],
        smoker: [0, 1],
        family_history: [0, 1],
        regular_health_checkup: [0, 1]
    };

    const avgProfile = {
        age: normalize(d3.mean(filtered, d => d.age), minMax.age[0], minMax.age[1]),
        bmi: normalize(d3.mean(filtered, d => d.bmi), minMax.bmi[0], minMax.bmi[1]),
        smoker: normalize(d3.mean(filtered, d => catToNum.smoker[d.smoker]), minMax.smoker[0], minMax.smoker[1]),
        alcohol_consumption: normalize(d3.mean(filtered, d => catToNum.alcohol_consumption[d.alcohol_consumption]), minMax.alcohol_consumption[0], minMax.alcohol_consumption[1]),
        diet_type: normalize(d3.mean(filtered, d => catToNum.diet_type[d.diet_type]), minMax.diet_type[0], minMax.diet_type[1]),
        physical_activity_level: normalize(d3.mean(filtered, d => catToNum.physical_activity_level[d.physical_activity_level]), minMax.physical_activity_level[0], minMax.physical_activity_level[1]),
        family_history: normalize(d3.mean(filtered, d => catToNum.family_history[d.family_history]), minMax.family_history[0], minMax.family_history[1]),
        mental_stress_level: normalize(d3.mean(filtered, d => catToNum.mental_stress_level[d.mental_stress_level]), minMax.mental_stress_level[0], minMax.mental_stress_level[1]),
        sleep_hours: normalize(d3.mean(filtered, d => d.sleep_hours), minMax.sleep_hours[0], minMax.sleep_hours[1]),
        regular_health_checkup: normalize(d3.mean(filtered, d => catToNum.regular_health_checkup[d.regular_health_checkup]), minMax.regular_health_checkup[0], minMax.regular_health_checkup[1])
    };
    
    // Convertir a un formato de array para el radar chart, donde cada elemento es {axis: "Nombre", value: 0.X}
    const radarData = Object.keys(avgProfile).map(key => ({
        axis: key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()), // Formatear el nombre del eje
        value: avgProfile[key]
    }));

    return radarData;
}


function drawRadarChart() {
    const container = d3.select("#chart-radar");
    container.select("svg").remove(); // Limpiar SVG anterior

    const margin = 50; // Margen para las etiquetas
    const width = container.node().getBoundingClientRect().width;
    const height = 400; // Altura ajustada para el radar
    const radius = Math.min(width, height) / 2 - margin; // Radio máximo del radar

    const svg = container.append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", `translate(${width / 2},${height / 2})`); // Centrar el radar

    const tooltip = d3.select("#tooltip");

    if (!fullData || fullData.length === 0) {
        svg.append("text")
            .attr("x", 0)
            .attr("y", 0)
            .attr("text-anchor", "middle")
            .attr("fill", "#999")
            .text("Cargando datos para el Radar Chart...");
        return;
    }

    // Obtener los perfiles promedio
    const profileLow = calculateAverageProfile('Low');
    const profileMedium = calculateAverageProfile('Medium');
    const profileHigh = calculateAverageProfile('High');

    // Filtrar perfiles nulos (si no hay datos para un nivel de riesgo)
    const allProfiles = [
        { name: 'Low Risk', values: profileLow, color: riskColors.Low },
        { name: 'Medium Risk', values: profileMedium, color: riskColors.Medium },
        { name: 'High Risk', values: profileHigh, color: riskColors.High }
    ].filter(p => p.values !== null);

    if (allProfiles.length === 0) {
        svg.append("text")
            .attr("x", 0)
            .attr("y", 0)
            .attr("text-anchor", "middle")
            .attr("fill", "#999")
            .text("No hay datos suficientes para generar perfiles de riesgo.");
        console.warn("drawRadarChart: No hay perfiles válidos para dibujar.");
        return;
    }

    // Definir los ejes (características)
    const axes = allProfiles[0].values.map(d => d.axis);
    const numAxes = axes.length;

    // Escala angular
    const angleSlice = Math.PI * 2 / numAxes;
    const rScale = d3.scaleLinear()
        .range([0, radius])
        .domain([0, 1]); // Porque los valores están normalizados entre 0 y 1

    // Creación de las "telarañas" (círculos concéntricos)
    const radarLines = svg.selectAll(".radar-levels")
        .data(d3.range(1, 6).map(i => i * radius / 5)) // 5 niveles concéntricos
        .join("circle")
        .attr("class", "radar-levels")
        .attr("r", d => d)
        .style("fill", "none")
        .style("stroke", "#ccc")
        .style("stroke-dasharray", ("3,3"))
        .style("stroke-opacity", 0.75);

    // Ejes (líneas radiales desde el centro)
    const axis = svg.selectAll(".axis")
        .data(axes)
        .join("g")
        .attr("class", "axis");

    axis.append("line")
        .attr("x1", 0)
        .attr("y1", 0)
        .attr("x2", (d, i) => rScale(1) * Math.cos(angleSlice * i - Math.PI / 2))
        .attr("y2", (d, i) => rScale(1) * Math.sin(angleSlice * i - Math.PI / 2))
        .attr("class", "line")
        .style("stroke", "grey")
        .style("stroke-width", "1px");

    // Etiquetas de los ejes
    axis.append("text")
        .attr("class", "legend")
        .style("font-size", "10px")
        .attr("text-anchor", "middle")
        .attr("dy", "0.35em")
        .attr("x", (d, i) => rScale(1.1) * Math.cos(angleSlice * i - Math.PI / 2)) // Ligeramente fuera del círculo
        .attr("y", (d, i) => rScale(1.1) * Math.sin(angleSlice * i - Math.PI / 2))
        .text(d => d);

    // Líneas de cada perfil (las áreas coloreadas)
    const radarLine = d3.lineRadial()
        .curve(d3.curveCardinalClosed) // Curva suave y cerrada
        .radius(d => rScale(d.value))
        .angle((d, i) => i * angleSlice);

    svg.selectAll(".radar-area")
        .data(allProfiles)
        .join("path")
        .attr("class", "radar-area")
        .attr("d", d => radarLine(d.values))
        .style("fill", d => d.color)
        .style("fill-opacity", 0.2) // Ligeramente transparente
        .style("stroke-width", 2)
        .style("stroke", d => d.color)
        .on("mouseover", function(event, d) {
            d3.select(this).style("fill-opacity", 0.4);
            tooltip.transition().duration(200).style("opacity", .9);
            let tooltipHtml = `<strong>${d.name}</strong><br>`;
            d.values.forEach(v => {
                tooltipHtml += `${v.axis}: ${(v.value * 100).toFixed(1)}%<br>`; // Mostrar en porcentaje
            });
            tooltip
                .html(tooltipHtml)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function(event, d) {
            d3.select(this).style("fill-opacity", 0.2);
            tooltip.transition().duration(500).style("opacity", 0);
        });

    // Puntos en cada eje para cada perfil
    svg.selectAll(".radar-points")
        .data(allProfiles)
        .join("g")
        .attr("class", "radar-points")
        .style("fill", d => d.color)
        .selectAll("circle")
        .data(d => d.values.map(v => ({ value: v.value, axis: v.axis, name: d.name, color: d.color }))) // Adjuntar nombre y color para tooltip
        .join("circle")
            .attr("r", 4)
            .attr("cx", (d, i) => rScale(d.value) * Math.cos(angleSlice * i - Math.PI / 2))
            .attr("cy", (d, i) => rScale(d.value) * Math.sin(angleSlice * i - Math.PI / 2))
            .style("fill-opacity", 0.8)
            .on("mouseover", function(event, d) {
                tooltip.transition().duration(200).style("opacity", .9);
                tooltip.html(`
                    <strong>${d.name}</strong><br>
                    ${d.axis}: ${(d.value * 100).toFixed(1)}%
                `)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 28) + "px");
            })
            .on("mouseout", function(event, d) {
                tooltip.transition().duration(500).style("opacity", 0);
            });
    
    // Leyenda del gráfico de radar
    const legend = svg.append("g")
        .attr("class", "legend")
        .attr("transform", `translate(${radius + 20}, ${-height / 2 + 20})`); // Posicionar la leyenda fuera del radar

    allProfiles.forEach((p, i) => {
        const legendRow = legend.append("g")
            .attr("transform", `translate(0, ${i * 20})`);

        legendRow.append("rect")
            .attr("width", 10)
            .attr("height", 10)
            .attr("fill", p.color);

        legendRow.append("text")
            .attr("x", 20)
            .attr("y", 10)
            .attr("text-anchor", "start")
            .style("font-size", "12px")
            .text(p.name);
    });

}