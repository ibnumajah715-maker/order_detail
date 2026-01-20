# 1️⃣ Impor pustaka Naive Bayes
from sklearn.naive_bayes import GaussianNB

# 2️⃣ Siapkan data
X = [[25, 50000],
     [35, 60000],
     [45, 80000],
     [20, 20000]]  # fitur: umur dan pendapatan

y = ['Tidak', 'Ya', 'Ya', 'Tidak']  # hasil: beli atau tidak

# 3️⃣ Buat model Naive Bayes
model = GaussianNB()

# 4️⃣ Latih model dengan data
model.fit(X, y)

# 5️⃣ Prediksi data baru
hasil = model.predict([[30, 55000]])

print("Prediksi:", hasil)
