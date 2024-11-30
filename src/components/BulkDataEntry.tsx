import React, { useState } from 'react';
import { ExcelVeri } from '../services/excelService';

interface BulkDataEntryProps {
  onDataSubmit: (data: ExcelVeri[]) => void;
}

export default function BulkDataEntry({ onDataSubmit }: BulkDataEntryProps) {
  const [rawData, setRawData] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleDataChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setRawData(event.target.value);
    setError(null);
  };

  const handleSubmit = () => {
    try {
      const lines = rawData.trim().split('\n');
      const parsedData: ExcelVeri[] = [];

      lines.forEach((line, index) => {
        const [dateStr, amountStr] = line.split('\t');
        if (!dateStr || !amountStr) {
          throw new Error(`Satır ${index + 1}: Geçersiz veri formatı`);
        }

        // Tarih formatını parse et (DD.MM.YYYY)
        const [day, month, year] = dateStr.split('.');
        if (!day || !month || !year) {
          throw new Error(`Satır ${index + 1}: Geçersiz tarih formatı`);
        }

        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        if (isNaN(date.getTime())) {
          throw new Error(`Satır ${index + 1}: Geçersiz tarih`);
        }

        const amount = parseFloat(amountStr.replace(/[.,]/g, ''));
        if (isNaN(amount)) {
          throw new Error(`Satır ${index + 1}: Geçersiz tutar`);
        }

        parsedData.push({
          tarih: date,
          tutar: amount
        });
      });

      onDataSubmit(parsedData);
      setRawData('');
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Veri işlenirken bir hata oluştu');
    }
  };

  return (
    <div className="mt-4 p-4 border rounded-lg">
      <h3 className="text-lg font-semibold mb-2">Toplu Veri Girişi</h3>
      <textarea
        className="w-full h-48 p-2 border rounded-lg mb-2"
        value={rawData}
        onChange={handleDataChange}
        placeholder="Verileri Tarih[tab]Tutar formatında girin:&#10;17.03.2023&#9;13600&#10;2.04.2023&#9;9300"
      />
      {error && <div className="text-red-500 mb-2">{error}</div>}
      <button
        onClick={handleSubmit}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
      >
        Verileri Ekle
      </button>
    </div>
  );
}
