# CMSC471 Assignment 2: White Hat vs. Black Hat Visualization

**Authors:** Elizabeth Ipe & Parsa Sedghi  
**Course:** CMSC471: Introduction to Information Visualization (Spring 2026)

## Project Overview
It is tempting to view data visualization as a neutral, objective medium. However, design choices can drastically alter the insights a reader walks away with. This project explores the ethical responsibilities of data visualization by presenting a single dataset—World Bank Gender Statistics on Education—from two radically different perspectives.

### Visual One: The White Hat
Our transparent, "White Hat" visualization explores the structural barriers affecting the educational pipeline. 
* **The Design:** An interactive scatterplot mapping the Total Fertility Rate against the Secondary Education Gender Gap. 
* **The Narrative:** By extending the data to include fertility rates, we reveal that the gender gap in education is heavily tied to structural realities; countries with high adolescent fertility rates see significantly higher drop-out rates for girls. 
* **Features:** Intuitive parity-baseline shading, enrollment-level color coding, and an interactive timeline slider.

### Visual Two: The Black Hat
Our deceptive, "Black Hat" visualization uses the exact same dataset to push a highly skewed narrative that men are being actively pushed out of higher education.
* **The Design:** A clean, professional-looking grouped bar chart that appears trustworthy at first glance.
* **The Deception:** We utilized several "black hat" cognitive biases, including **cherry-picking** (filtering out 95% of the globe to show only 6 high-income nations where the female advantage is highest) and a **truncated y-axis** (starting at 40% to visually exaggerate the gap). 

## Dataset
**World Bank Gender Statistics**
* `School enrollment, tertiary, female/male (% gross)`
* `School enrollment, secondary, female/male (% gross)`
* `Fertility rate, total (births per woman)`
