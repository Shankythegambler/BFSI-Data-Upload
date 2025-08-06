document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('file-input');
    const fileInfoContainer = document.getElementById('file-info-container');
    const fileInfo = document.getElementById('file-info');
    const uploadDataButton = document.getElementById('upload-data-button');
    
    const noDataText = document.getElementById('no-data-text');
    const summaryTableContainer = document.getElementById('data-summary-table-container');
    const summaryTableBody = document.getElementById('summary-table-body');
    
    const dataTableBody = document.querySelector('#data-table tbody');
    const filteredResultsSection = document.getElementById('filtered-results-section');
    const paginationControls = document.getElementById('pagination-controls');
    const fromDateInput = document.getElementById('from-date');
    const toDateInput = document.getElementById('to-date');
    const filterButton = document.getElementById('filter-button');
    const exportJsonButton = document.getElementById('export-json-button');
    const exportCsvButton = document.getElementById('export-csv-button');

    const expectedHeaders = [
        "Date", "Client Name", "Input Data", "Service Name", "Vendor Name",
        "Delivery Date", "V Send Date", "V Receive Date", "Other Remarks"
    ];
    
    const entriesPerPage = 10;
    let allData = [];
    let filteredData = [];
    let currentPage = 1;

    // Load data from local storage on page load
    function loadDataFromLocalStorage() {
        const storedData = localStorage.getItem('appData');
        if (storedData) {
            allData = JSON.parse(storedData);
        } else {
            allData = [];
        }
        updateSummaryTable();
    }
    
    // Save data to local storage
    function saveDataToLocalStorage() {
        localStorage.setItem('appData', JSON.stringify(allData));
        updateSummaryTable();
    }
    
    // Update the data summary table
    function updateSummaryTable() {
        summaryTableBody.innerHTML = '';
        if (allData.length > 0) {
            noDataText.style.display = 'none';
            summaryTableContainer.style.display = 'block';

            allData.forEach(upload => {
                const uploadDateObj = new Date(upload.uploadDate);
                const date = uploadDateObj.toLocaleDateString();
                const time = uploadDateObj.toLocaleTimeString();

                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${date}</td>
                    <td>${time}</td>
                    <td>${upload.entries.length}</td>
                    <td><button class="delete-button" data-upload-id="${upload.id}">Delete</button></td>
                `;
                summaryTableBody.appendChild(row);
            });
        } else {
            noDataText.style.display = 'block';
            summaryTableContainer.style.display = 'none';
            filteredResultsSection.style.display = 'none';
        }
    }

    // Render the pagination buttons
    function renderPaginationButtons() {
        paginationControls.innerHTML = '';
        const totalPages = Math.ceil(filteredData.length / entriesPerPage);

        if (totalPages <= 1) {
            return;
        }

        for (let i = 1; i <= totalPages; i++) {
            const button = document.createElement('button');
            button.textContent = i;
            button.classList.add('pagination-button');
            if (i === currentPage) {
                button.classList.add('active');
            }
            button.addEventListener('click', () => {
                currentPage = i;
                renderFilteredResults();
                document.querySelectorAll('.pagination-button').forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
            });
            paginationControls.appendChild(button);
        }
    }

    // Render the table for filtered results (with pagination)
    function renderFilteredResults() {
        dataTableBody.innerHTML = '';
        const start = (currentPage - 1) * entriesPerPage;
        const end = start + entriesPerPage;
        const pageData = filteredData.slice(start, end);

        if (pageData.length === 0) {
            dataTableBody.innerHTML = '<tr><td colspan="9" style="text-align: center;">No filtered data available.</td></tr>';
            return;
        }
        
        pageData.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${item.Date}</td>
                <td>${item["Client Name"]}</td>
                <td>${item["Input Data"]}</td>
                <td>${item["Service Name"]}</td>
                <td>${item["Vendor Name"]}</td>
                <td>${item["Delivery Date"]}</td>
                <td>${item["V Send Date"]}</td>
                <td>${item["V Receive Date"]}</td>
                <td>${item["Other Remarks"]}</td>
            `;
            dataTableBody.appendChild(row);
        });
        renderPaginationButtons();
    }

    // Header validation function
    function validateHeaders(headers) {
        if (headers.length !== expectedHeaders.length) {
            return false;
        }
        for (let i = 0; i < headers.length; i++) {
            if (headers[i].trim() !== expectedHeaders[i].trim()) {
                return false;
            }
        }
        return true;
    }

    // CSV parsing function
    function parseCsv(csvText) {
        const lines = csvText.trim().split('\n');
        if (lines.length === 0) return [];
        
        const headers = lines[0].split(',').map(header => header.trim());

        if (!validateHeaders(headers)) {
            alert('Invalid CSV format. Headers do not match the required format.');
            return null;
        }

        const data = [];
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',');
            if (values.length === headers.length) {
                const entry = {};
                headers.forEach((header, index) => {
                    entry[header] = values[index].trim();
                });
                data.push(entry);
            }
        }
        return data;
    }

    // File Selection Handler
    fileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            fileInfo.textContent = `Selected file: ${file.name}`;
            fileInfoContainer.style.display = 'block';
        } else {
            fileInfoContainer.style.display = 'none';
        }
    });

    // Upload Data Handler: Now loads existing data before appending new data
    uploadDataButton.addEventListener('click', () => {
        const files = fileInput.files;  // Now we handle multiple files
        if (files.length === 0) {
            alert('Please select a file first.');
            return;
        }

        const reader = new FileReader();

        // Process each file selected
        Array.from(files).forEach(file => {
            reader.onload = function (e) {
                let importedData = null;
                const fileExtension = file.name.split('.').pop().toLowerCase();

                if (fileExtension === 'json') {
                    try {
                        const parsedData = JSON.parse(e.target.result);
                        if (Array.isArray(parsedData) && parsedData.length > 0) {
                            const headersFromData = Object.keys(parsedData[0]);
                            if (validateHeaders(headersFromData)) {
                                importedData = parsedData;
                            } else {
                                alert('Invalid JSON format. Object keys do not match the required headers.');
                            }
                        } else {
                            alert('Invalid JSON format. Please provide an array of objects.');
                        }
                    } catch (error) {
                        alert('Error parsing JSON file. Please ensure it is a valid JSON file.');
                        console.error(error);
                    }
                } else if (fileExtension === 'csv') {
                    importedData = parseCsv(e.target.result);
                } else {
                    alert('Unsupported file type. Please upload a .csv or .json file.');
                }

                if (importedData) {
                    // Load existing data from localStorage first
                    const existingData = JSON.parse(localStorage.getItem('appData')) || [];
                    const newUploadSession = {
                        id: Date.now(),
                        uploadDate: Date.now(),
                        entries: importedData
                    };

                    existingData.push(newUploadSession);  // Append new data to the existing data
                    allData = existingData;  // Update the global allData array
                    saveDataToLocalStorage();  // Save to localStorage
                    alert('Data uploaded and saved successfully!');
                    fileInfoContainer.style.display = 'none';
                    fileInput.value = '';  // Reset file input
                }
            };
            reader.readAsText(file);  // Read the file as text
        });
    });

    // Delete Upload Session Handler
    summaryTableBody.addEventListener('click', (event) => {
        if (event.target.classList.contains('delete-button')) {
            const uploadIdToDelete = parseInt(event.target.dataset.uploadId);
            if (confirm('Are you sure you want to delete this entire upload session? This cannot be undone.')) {
                allData = allData.filter(upload => upload.id !== uploadIdToDelete);
                saveDataToLocalStorage();
            }
        }
    });

    // Filter and Export Handlers
    filterButton.addEventListener('click', () => {
        const fromDate = fromDateInput.value;
        const toDate = toDateInput.value;

        if (allData.length === 0) {
            alert('No data has been uploaded yet.');
            return;
        }

        if (!fromDate || !toDate) {
            alert('Please select both a "From Date" and a "To Date".');
            return;
        }

        let combinedData = [];
        allData.forEach(upload => {
            combinedData = combinedData.concat(upload.entries);
        });

        filteredData = combinedData.filter(item => {
            const itemDate = new Date(item.Date);
            const startDate = new Date(fromDate);
            const endDate = new Date(toDate);
            endDate.setDate(endDate.getDate() + 1);

            return itemDate >= startDate && itemDate < endDate;
        });
        
        filteredResultsSection.style.display = 'block';
        currentPage = 1;
        renderFilteredResults();
    });

    exportJsonButton.addEventListener('click', () => {
        const exportedData = getDisplayedData();
        if (exportedData.length === 0) {
            alert('No data to export.');
            return;
        }
        const jsonData = JSON.stringify(exportedData, null, 2);
        downloadFile(jsonData, 'filtered_data.json', 'application/json');
    });

    exportCsvButton.addEventListener('click', () => {
        const exportedData = getDisplayedData();
        if (exportedData.length === 0) {
            alert('No data to export.');
            return;
        }
        const csv = convertToCsv(exportedData);
        downloadFile(csv, 'filtered_data.csv', 'text/csv');
    });

    // Helper functions
    function getDisplayedData() {
        const data = [];
        const rows = dataTableBody.querySelectorAll('tr');
        const headers = Array.from(document.querySelectorAll('#data-table thead th')).map(th => th.textContent.trim());

        rows.forEach(row => {
            const rowData = {};
            const cells = row.querySelectorAll('td');
            if(cells.length === headers.length) {
                headers.forEach((header, index) => {
                    rowData[header] = cells[index].textContent.trim();
                });
                data.push(rowData);
            }
        });
        return data;
    }

    function convertToCsv(data) {
        if (data.length === 0) return '';
        
        const headers = Object.keys(data[0]).filter(h => h !== 'id' && h !== 'uploadDate');
        const headerRow = headers.join(',') + '\n';
        const rows = data.map(row => 
            headers.map(header => {
                let value = row[header] || '';
                value = value.replace(/"/g, '""');
                if (value.includes(',') || value.includes('\n')) {
                    value = `"${value}"`;
                }
                return value;
            }).join(',')
        ).join('\n');

        return headerRow + rows;
    }

    function downloadFile(content, fileName, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // Initialize the app
    loadDataFromLocalStorage();
});
