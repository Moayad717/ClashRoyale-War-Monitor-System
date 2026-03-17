use crate::models::CsvWarRecord;
use std::error::Error;
use std::fs::File;

pub fn load_csv(path: &str) -> Result<Vec<CsvWarRecord>, Box<dyn Error>> {
    let file = File::open(path)?;
    let mut reader = csv::Reader::from_reader(file);

    let mut records = Vec::new();

    for result in reader.deserialize() {
        let record: CsvWarRecord = result?;
        records.push(record);
    }

    Ok(records)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_load_csv() {
        let records = load_csv("data/clan-2Q9Q2CU.csv");
        assert!(records.is_ok());
        if let Ok(data) = records {
            assert!(data.len() > 0);
            println!("Loaded {} records", data.len());
        }
    }
}
