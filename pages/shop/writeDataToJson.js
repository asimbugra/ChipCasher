const fs = require('fs');

// Verileri JSON dosyasından okuma
function readDataFromJson() {
  try {
    const jsonData = fs.readFileSync('paymentData.json', 'utf8');
    return JSON.parse(jsonData);
  } catch (error) {
    // JSON dosyası henüz oluşturulmamışsa veya okunamıyorsa boş bir nesne döndürün
    return {};
  }
}

// Verileri JSON dosyasına yazma
function writeDataToJson(newData) {
  // Mevcut verileri dosyadan oku
  const existingData = readDataFromJson();

  // Yeni verileri mevcut verilere ekleyin
  const updatedData = {
    ...existingData,
    ...newData,
  };

  // JSON dosyasına veriyi yaz
  const jsonData = JSON.stringify(updatedData, null, 2);
  fs.writeFileSync('paymentData.json', jsonData);
}

module.exports = writeDataToJson;
