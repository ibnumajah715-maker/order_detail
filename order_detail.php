<?php
$host = "localhost";
$dbname = "haven_fashion";
$username = "root";
$password = "";

try {
    $conn = new PDO("mysql:host=$host;dbname=$dbname", $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch(PDOException $e) {
    die("Koneksi gagal: " . $e->getMessage());
}

// Ambil semua pesanan dari tabel orders
$stmt = $conn->query("SELECT * FROM orders ORDER BY created_at DESC");
$orders = $stmt->fetchAll(PDO::FETCH_ASSOC);
?>

<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<title>Pesanan Saya</title>
<style>
    body {
        font-family: 'Segoe UI', Arial, sans-serif;
        background: #f7f8fa;
        margin: 0;
        padding: 0;
    }
    .container {
        width: 90%;
        max-width: 900px;
        margin: 50px auto;
        background: #fff;
        border-radius: 15px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.1);
        padding: 25px;
    }
    h2 {
        text-align: center;
        color: #333;
        margin-bottom: 30px;
    }
    table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 15px;
    }
    th, td {
        padding: 12px 15px;
        text-align: left;
        border-bottom: 1px solid #ddd;
    }
    th {
        background: #333;
        color: white;
    }
    tr:hover {
        background: #f1f1f1;
    }
    .btn-detail {
        background: #007bff;
        color: white;
        padding: 8px 15px;
        border-radius: 6px;
        text-decoration: none;
        transition: 0.3s;
    }
    .btn-detail:hover {
        background: #0056b3;
    }
    .no-data {
        text-align: center;
        color: #777;
        margin-top: 20px;
    }
</style>
</head>
<body>

<div class="container">
    <h2>Daftar Pesanan Saya</h2>

    <?php if (count($orders) > 0): ?>
        <table>
            <tr>
                <th>No. Pesanan</th>
                <th>Tanggal</th>
                <th>Status</th>
                <th>Total</th>
                <th>Aksi</th>
            </tr>
            <?php foreach ($orders as $order): ?>
            <tr>
                <td><?= htmlspecialchars($order['order_number']) ?></td>
                <td><?= $order['created_at'] ?></td>
                <td><?= htmlspecialchars($order['status'] ?? 'Menunggu Konfirmasi') ?></td>
                <td>Rp<?= number_format($order['total_amount'], 0, ',', '.') ?></td>
                <td><a href="order_detail.php?id=<?= $order['id'] ?>" class="btn-detail">Lihat Detail</a></td>
            </tr>
            <?php endforeach; ?>
        </table>
    <?php else: ?>
        <p class="no-data">Belum ada pesanan yang dibuat.</p>
    <?php endif; ?>
</div>

</body>
</html>
