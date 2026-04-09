// chart dimensions
const M1 = { top: 95, right: 50, bottom: 65, left: 75 };
const W1 = 650, H1 = 430;

const M2 = { top: 50, right: 40, bottom: 80, left: 75 };
const W2 = 620, H2 = 360;

// black hat: cherry-picked high-income countries
const BH_COUNTRIES = ['United States','Canada','Sweden','Iceland','Norway','United Kingdom'];
const BH_TRUNC = 40;  // deliberately does NOT start at 0 for this 

const COL_F_SEC  = 'average_value_School enrollment, secondary, female (% gross)';
const COL_M_SEC  = 'average_value_School enrollment, secondary, male (% gross)';
const COL_FERT   = 'average_value_Fertility rate, total (births per woman)';
const COL_F_TER  = 'average_value_School enrollment, tertiary, female (% gross)';
const COL_M_TER  = 'average_value_School enrollment, tertiary, male (% gross)';

const tip = d3.select('body').append('div').attr('class', 'tooltip').style('opacity', 0);

let allScatterData = [];  // all country-year points (for year toggle)
let scatterData    = [];  // current year's points (rendered)
let fullData       = [];  // tertiary enrollment for black hat
let selYear        = 2015;

// fixed scales. This is computed over ALL years so axes don't jump
let xScAll, yScAll;

let svg1, g1;
let svg2, g2, xSc2, ySc2;

function init() {
    svg1 = d3.select('#chart1').append('svg')
        .attr('width',  W1 + M1.left + M1.right)
        .attr('height', H1 + M1.top  + M1.bottom);
    g1 = svg1.append('g').attr('transform', `translate(${M1.left},${M1.top})`);

    svg2 = d3.select('#chart2').append('svg')
        .attr('width',  W2 + M2.left + M2.right)
        .attr('height', H2 + M2.top  + M2.bottom);
    g2 = svg2.append('g').attr('transform', `translate(${M2.left},${M2.top})`);

    d3.csv('data/gender.csv').then(raw => {
        parseData(raw);
        buildChart1();
        buildChart2();
        setupYearSlider();
    }).catch(err => console.error('Data load error:', err));
}

// color by average secondary enrollment level
const enrollColor = d => {
    const avg = (d.fSec + d.mSec) / 2;
    if (avg > 90) return '#2563eb';
    if (avg > 60) return '#16a34a';
    return '#ea580c';
};

const AGGREGATE_KW = [
    'World','income','region','Africa Eastern','Africa Western',
    'Pacific','Caribbean','OECD','Euro area','Arab','Fragile','IDA','IBRD',
    'dividend','Sub-Saharan','Latin America','Middle East','North Africa',
    'Central Europe','South Asia','East Asia','Heavily','Small states',
    'island','developing','least developed','Late-demographic',
    'North America','Europe & Central'
];

function isAggregate(name) {
    return AGGREGATE_KW.some(kw => name.includes(kw));
}

function parseData(rows) {
    // tertiary enrollment for black hat
    fullData = rows.map(r => {
        const f = +r[COL_F_TER], m = +r[COL_M_TER];
        return { country: r['Country Name'], year: +r['Year'], f, m };
    }).filter(d =>
        d.year >= 1970 && d.year <= 2019 &&
        !isNaN(d.f) && !isNaN(d.m) && d.f > 0 && d.m > 0
    );

    // ALL country-year scatter points (for year toggle)
    allScatterData = rows.map(r => ({
        country: r['Country Name'],
        year:    +r['Year'],
        fSec:    +r[COL_F_SEC],
        mSec:    +r[COL_M_SEC],
        fert:    +r[COL_FERT]
    })).filter(d =>
        !isAggregate(d.country) &&
        !isNaN(d.fSec) && d.fSec > 0 &&
        !isNaN(d.mSec) && d.mSec > 0 &&
        !isNaN(d.fert) && d.fert > 0
    );

    // pick the most-populated year as default
    const yearCounts = d3.rollup(allScatterData, v => v.length, d => d.year);
    selYear = Array.from(yearCounts.entries())
        .filter(([y]) => y >= 2010)
        .sort((a, b) => b[1] - a[1])[0][0];

    scatterData = allScatterData.filter(d => d.year === selYear);
}


// CHART 1

function buildChart1() {
    //fixed scales over ALL years so axes never jump during year changes
    const allGaps  = allScatterData.map(d => d.fSec - d.mSec);
    const allFerts = allScatterData.map(d => d.fert);

    const xMin = Math.floor(d3.min(allFerts) * 10) / 10;
    const xMax = Math.ceil(d3.max(allFerts)  * 10) / 10;
    const yMin = Math.floor(d3.min(allGaps)  / 5) * 5 - 2;
    const yMax = Math.ceil(d3.max(allGaps)   / 5) * 5 + 2;

    xScAll = d3.scaleLinear().domain([xMin, xMax]).range([0, W1]).nice();
    yScAll = d3.scaleLinear().domain([yMin, yMax]).range([H1, 0]).nice();

    const xSc = xScAll, ySc = yScAll;

    // background chart shading
    const y0 = ySc(0);
    g1.append('rect')
        .attr('x', 0).attr('y', 0)
        .attr('width', W1).attr('height', y0)
        .attr('fill', '#e0f0ff').attr('opacity', 0.5);
    g1.append('rect')
        .attr('x', 0).attr('y', y0)
        .attr('width', W1).attr('height', H1 - y0)
        .attr('fill', '#fff3e0').attr('opacity', 0.5);

    // zone labels
    g1.append('text').attr('class', 'zone-label')
        .attr('x', W1 - 6).attr('y', 14).attr('text-anchor', 'end')
        .attr('fill', '#1d4ed8').text('More girls enrolled ▲');
    g1.append('text').attr('class', 'zone-label')
        .attr('x', W1 - 6).attr('y', H1 - 8).attr('text-anchor', 'end')
        .attr('fill', '#c2410c').text('More boys enrolled ▼');

    // zero reference line
    g1.append('line')
        .attr('x1', 0).attr('x2', W1)
        .attr('y1', y0).attr('y2', y0)
        .attr('stroke', '#999').attr('stroke-dasharray', '4 3').attr('stroke-width', 1);

    // axises
    g1.append('g').attr('class', 'x-axis')
        .attr('transform', `translate(0,${H1})`)
        .call(d3.axisBottom(xSc).ticks(8));

    g1.append('g').attr('class', 'y-axis')
        .call(d3.axisLeft(ySc).ticks(8).tickFormat(d => (d > 0 ? '+' : '') + d));

    // axis labels
    g1.append('text').attr('class', 'axis-label')
        .attr('x', W1 / 2).attr('y', H1 + 50)
        .attr('text-anchor', 'middle')
        .text('Total fertility rate (births per woman)');

    g1.append('text').attr('class', 'axis-label')
        .attr('transform', 'rotate(-90)')
        .attr('x', -H1 / 2).attr('y', -62)
        .attr('text-anchor', 'middle')
        .text('Education gap (F − M secondary enrollment, %pt)');

    // dots drawn by updateScatter
    g1.append('g').attr('class', 'dots-g');

    updateScatter();

    // legend
    const legData = [
        { label: 'High enrollment (>90%)', color: '#2563eb' },
        { label: 'Mid enrollment (60–90%)', color: '#16a34a' },
        { label: 'Low enrollment (<60%)',   color: '#ea580c' }
    ];
    const legG = g1.append('g').attr('transform', 'translate(0, -30)');
    legData.forEach((d, i) => {
        const lx = i * 185;
        legG.append('circle')
            .attr('cx', lx + 5).attr('cy', 0).attr('r', 6)
            .attr('fill', d.color).attr('opacity', 0.85);
        legG.append('text')
            .attr('x', lx + 17).attr('y', 0).attr('dy', '0.35em')
            .attr('font-size', '11px').attr('fill', '#333')
            .attr('font-family', 'Arial, sans-serif')
            .text(d.label);
    });

    // chart title
    svg1.append('text').attr('class', 'chart-title')
        .attr('x', M1.left + W1 / 2).attr('y', 16)
        .attr('text-anchor', 'middle')
        .text('Fertility rate vs. education gender gap');

    // subtitle 
    g1.append('text')
        .attr('x', 0).attr('y', -58)
        .attr('font-size', '11px').attr('fill', '#666')
        .attr('font-family', 'Arial, sans-serif')
        .text('Gap = female secondary enrollment (%) − male secondary enrollment (%). Positive = more girls enrolled.');

    // ── count label ──
    g1.append('text').attr('id', 'scatter-count')
        .attr('x', W1).attr('y', -58)
        .attr('text-anchor', 'end')
        .attr('font-size', '11px').attr('fill', '#888')
        .attr('font-family', 'Arial, sans-serif')
        .text('');

    // footer axis label
    svg1.append('text')
        .attr('x', M1.left + W1 / 2)
        .attr('y', M1.top + H1 + M1.bottom - 2)
        .attr('text-anchor', 'middle')
        .attr('font-size', '10px').attr('fill', '#999')
        .attr('font-family', 'Arial, sans-serif')
        .text('x-axis: fertility rate (births per woman)  ·  y-axis: female − male secondary enrollment (%pt)');
}


function updateScatter() {
    scatterData = allScatterData.filter(d => d.year === selYear);

    // dots with transition as the year changes
    g1.select('.dots-g').selectAll('.scatter-dot')
        .data(scatterData, d => d.country)
        .join(
            enter => enter.append('circle')
                .attr('class', 'scatter-dot')
                .attr('cx', d => xScAll(d.fert))
                .attr('cy', d => yScAll(d.fSec - d.mSec))
                .attr('r', 0)
                .attr('fill', d => enrollColor(d))
                .attr('opacity', 0.75)
                .attr('stroke', '#fff')
                .attr('stroke-width', 0.5)
                .call(e => e.transition().duration(300).attr('r', 5.5))
                .on('mouseover', (ev, d) => {
                    tip.html(`<strong>${d.country}</strong> (${d.year})<br>Fertility rate: <b>${d.fert.toFixed(2)}</b><br>F secondary: ${d.fSec.toFixed(1)}%<br>M secondary: ${d.mSec.toFixed(1)}%<br>Gap: <b>${(d.fSec - d.mSec) >= 0 ? '+' : ''}${(d.fSec - d.mSec).toFixed(1)} pp</b>`)
                        .style('opacity', 1)
                        .style('left', (ev.pageX + 14) + 'px')
                        .style('top',  (ev.pageY - 28) + 'px');
                })
                .on('mousemove', ev => tip
                    .style('left', (ev.pageX + 14) + 'px')
                    .style('top',  (ev.pageY - 28) + 'px'))
                .on('mouseout', () => tip.style('opacity', 0)),
            update => update
                .on('mouseover', (ev, d) => {
                    tip.html(`<strong>${d.country}</strong> (${d.year})<br>Fertility rate: <b>${d.fert.toFixed(2)}</b><br>F secondary: ${d.fSec.toFixed(1)}%<br>M secondary: ${d.mSec.toFixed(1)}%<br>Gap: <b>${(d.fSec - d.mSec) >= 0 ? '+' : ''}${(d.fSec - d.mSec).toFixed(1)} pp</b>`)
                        .style('opacity', 1)
                        .style('left', (ev.pageX + 14) + 'px')
                        .style('top',  (ev.pageY - 28) + 'px');
                })
                .on('mousemove', ev => tip
                    .style('left', (ev.pageX + 14) + 'px')
                    .style('top',  (ev.pageY - 28) + 'px'))
                .on('mouseout', () => tip.style('opacity', 0))
                .call(u => u.transition().duration(400)
                    .attr('cx', d => xScAll(d.fert))
                    .attr('cy', d => yScAll(d.fSec - d.mSec))
                    .attr('r', 5.5)
                    .attr('fill', d => enrollColor(d))),
            exit => exit.call(e => e.transition().duration(200).attr('r', 0).remove())
        );

    // update country count label
    d3.select('#scatter-count').text(`${scatterData.length} countries · ${selYear}`);
}

function setupYearSlider() {
    const years = [...new Set(allScatterData.map(d => d.year))].sort();
    const slider = document.getElementById('yearSlider');
    const label  = document.getElementById('yearLabel');
    slider.min   = years[0];
    slider.max   = years.at(-1);
    slider.value = selYear;
    label.textContent = selYear;
    slider.addEventListener('input', function () {
        selYear = +this.value;
        label.textContent = selYear;
        updateScatter();
    });
}


// Chart 2

function buildChart2() {
    const bhData = BH_COUNTRIES.map(c => {
        const rows = fullData.filter(d => d.country === c).sort((a, b) => b.year - a.year);
        const r = rows[0];
        return r ? { country: c, f: r.f, m: r.m, year: r.year } : null;
    }).filter(Boolean);

    const xOuter = d3.scaleBand()
        .domain(bhData.map(d => d.country))
        .range([0, W2]).paddingInner(0.25).paddingOuter(0.1);

    const xInner = d3.scaleBand()
        .domain(['Women', 'Men'])
        .range([0, xOuter.bandwidth()]).padding(0.08);

    const yMax = Math.ceil(d3.max(bhData, d => d.f) / 10) * 10 + 5;
    xSc2 = xOuter;
    ySc2 = d3.scaleLinear().domain([BH_TRUNC, yMax]).range([H2, 0]);  // truncated

    g2.append('g').attr('class', 'x-axis')
        .attr('transform', `translate(0,${H2})`)
        .call(d3.axisBottom(xOuter).tickSizeOuter(0));

    g2.append('g').attr('class', 'y-axis')
        .call(d3.axisLeft(ySc2).ticks(6).tickFormat(d => d + '%'));

    g2.append('text').attr('class', 'axis-label')
        .attr('x', W2 / 2).attr('y', H2 + 55)
        .attr('text-anchor', 'middle').text('Country');

    g2.append('text').attr('class', 'axis-label')
        .attr('transform', 'rotate(-90)')
        .attr('x', -H2 / 2).attr('y', -60)
        .attr('text-anchor', 'middle')
        .text('Tertiary Enrollment Rate (%)');

    const groups = g2.selectAll('.bar-group')
        .data(bhData).join('g')
        .attr('class', 'bar-group')
        .attr('transform', d => `translate(${xOuter(d.country)},0)`);

    groups.append('rect').attr('class', 'bh-bar female-bar')
        .attr('x', xInner('Women')).attr('width', xInner.bandwidth())
        .attr('y', d => ySc2(d.f)).attr('height', d => H2 - ySc2(d.f))
        .on('mouseover', (ev, d) => tip
            .html(`<strong>${d.country} — Women (${d.year})</strong><br>Enrollment: <b>${d.f.toFixed(1)}%</b><br><em>Note: gross rate can exceed 100%</em>`)
            .style('opacity', 1).style('left', (ev.pageX+14)+'px').style('top', (ev.pageY-28)+'px'))
        .on('mousemove', ev => tip.style('left',(ev.pageX+14)+'px').style('top',(ev.pageY-28)+'px'))
        .on('mouseout', () => tip.style('opacity', 0));

    groups.append('rect').attr('class', 'bh-bar male-bar')
        .attr('x', xInner('Men')).attr('width', xInner.bandwidth())
        .attr('y', d => ySc2(d.m)).attr('height', d => H2 - ySc2(d.m))
        .on('mouseover', (ev, d) => tip
            .html(`<strong>${d.country} — Men (${d.year})</strong><br>Enrollment: <b>${d.m.toFixed(1)}%</b>`)
            .style('opacity', 1).style('left', (ev.pageX+14)+'px').style('top', (ev.pageY-28)+'px'))
        .on('mousemove', ev => tip.style('left',(ev.pageX+14)+'px').style('top',(ev.pageY-28)+'px'))
        .on('mouseout', () => tip.style('opacity', 0));

    groups.append('text').attr('class', 'bar-label')
        .attr('x', xInner('Women') + xInner.bandwidth() / 2)
        .attr('y', d => ySc2(d.f) - 4).attr('text-anchor', 'middle')
        .text(d => d.f.toFixed(0) + '%');

    groups.append('text').attr('class', 'bar-label')
        .attr('x', xInner('Men') + xInner.bandwidth() / 2)
        .attr('y', d => ySc2(d.m) - 4).attr('text-anchor', 'middle')
        .text(d => d.m.toFixed(0) + '%');

    svg2.append('text').attr('class', 'chart-title bh-title')
        .attr('x', M2.left + W2 / 2).attr('y', 28)
        .attr('text-anchor', 'middle')
        .text('Men Left Behind: Women Now Dominate University Enrollment');

    const legX = W2 - 80, legY = 5;
    g2.append('rect').attr('x', legX).attr('y', legY)
        .attr('width', 14).attr('height', 14).attr('fill', '#7c3aed');
    g2.append('text').attr('class', 'bh-label')
        .attr('x', legX+18).attr('y', legY+7).attr('dy','0.35em').text('Women');
    g2.append('rect').attr('x', legX).attr('y', legY+22)
        .attr('width', 14).attr('height', 14).attr('fill', '#b91c1c');
    g2.append('text').attr('class', 'bh-label')
        .attr('x', legX+18).attr('y', legY+29).attr('dy','0.35em').text('Men');
}

window.addEventListener('load', init);