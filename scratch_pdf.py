import PyPDF2

def extract_text():
    with open('PB-53-Household-Carbon-Footprint-of-India_2nd-draft.pdf', 'rb') as f:
        reader = PyPDF2.PdfReader(f)
        text = ""
        for i in range(len(reader.pages)):
            text += reader.pages[i].extract_text()
            if len(text) > 5000:
                break
        print(text[:5000])

try:
    extract_text()
except Exception as e:
    print(e)
