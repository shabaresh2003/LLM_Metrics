import pandas as pd

xlsx = pd.ExcelFile('ghg-conversion-factors-2026-full-set.xlsx')

def find_val(sheet, search1):
    df = xlsx.parse(sheet)
    for index, row in df.iterrows():
        row_str = ' '.join([str(x) for x in row.values if pd.notna(x)])
        if search1 in row_str:
            print(f"[{sheet}] Found: {row_str}")

find_val('Passenger vehicles', 'Average car')
