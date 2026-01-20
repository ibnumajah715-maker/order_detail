<?php
session_start();
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

// Ambil user_id dari session (pastikan sudah login)
$user_id = $_SESSION['user_id'] ?? null;

if (!$user_id) {
    header("Location: login.php");
    exit();
}

// Query untuk mendapatkan data pesanan beserta detail produk
$stmt = $conn->prepare("
    SELECT 
        o.id,
        o.order_number,
        o.created_at,
        o.total_amount,
        o.status,
        o.shipping_address,
        o.payment_method,
        GROUP_CONCAT(CONCAT(oi.product_name, ' (x', oi.quantity, ')') SEPARATOR ', ') as items
    FROM orders o
    LEFT JOIN order_items oi ON o.id = oi.order_id
    WHERE o.user_id = ?
    GROUP BY o.id
    ORDER BY o.created_at DESC
");
$stmt->execute([$user_id]);
$orders = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Fungsi untuk styling status
function getStatusBadge($status) {
    $statusColors = [
        'pending' => '#ffc107',
        'processing' => '#17a2b8',
        'shipped' => '#007bff',
        'delivered' => '#28a745',
        'cancelled' => '#dc3545'
    ];
    
    $statusText = [
        'pending' => 'Menunggu Pembayaran',
        'processing' => 'Diproses',
        'shipped' => 'Dikirim',
        'delivered' => 'Selesai',
        'cancelled' => 'Dibatalkan'
    ];
    
    $color = $statusColors[$status] ?? '#6c757d';
    $text = $statusText[$status] ?? ucfirst($status);
    
    return "<span style='background: $color; color: white; padding: 5px 10px; border-radius: 15px; font-size: 12px;'>$text</span>";
}
?>

<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Pesanan Saya - Haven Fashion</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
        }

        .header {
            text-align: center;
            margin-bottom: 30px;
        }

        .header h1 {
            color: white;
            font-size: 2.5rem;
            margin-bottom: 10px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }

        .header p {
            color: rgba(255,255,255,0.8);
            font-size: 1.1rem;
        }

        .back-btn {
            display: inline-flex;
            align-items: center;
            background: rgba(255,255,255,0.2);
            color: white;
            padding: 12px 25px;
            border-radius: 25px;
            text-decoration: none;
            margin-bottom: 20px;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255,255,255,0.3);
            transition: all 0.3s ease;
        }

        .back-btn:hover {
            background: rgba(255,255,255,0.3);
            transform: translateY(-2px);
        }

        .orders-grid {
            display: grid;
            gap: 20px;
        }

        .order-card {
            background: white;
            border-radius: 15px;
            padding: 25px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            transition: transform 0.3s ease, box-shadow 0.3s ease;
            border-left: 5px solid #667eea;
        }

        .order-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 15px 40px rgba(0,0,0,0.15);
        }

        .order-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
            padding-bottom: 15px;
            border-bottom: 1px solid #eee;
        }

        .order-number {
            font-weight: bold;
            color: #333;
            font-size: 1.2rem;
        }

        .order-date {
            color: #666;
            font-size: 0.9rem;
        }

        .order-details {
            display: grid;
            grid-template-columns: 2fr 1fr 1fr 1fr;
            gap: 15px;
            margin-bottom: 15px;
        }

        .order-items {
            color: #555;
            line-height: 1.5;
        }

        .order-total {
            font-weight: bold;
            color: #2c5530;
            font-size: 1.1rem;
        }

        .order-address, .order-payment {
            color: #666;
            font-size: 0.9rem;
        }

        .order-footer {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: 15px;
            padding-top: 15px;
            border-top: 1px solid #eee;
        }

        .empty-state {
            text-align: center;
            padding: 60px 20px;
            background: white;
            border-radius: 15px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
        }

        .empty-state h3 {
            color: #333;
            margin-bottom: 10px;
            font-size: 1.5rem;
        }

        .empty-state p {
            color: #666;
            margin-bottom: 25px;
        }

        .shop-btn {
            display: inline-block;
            background: #667eea;
            color: white;
            padding: 12px 30px;
            border-radius: 25px;
            text-decoration: none;
            transition: all 0.3s ease;
        }

        .shop-btn:hover {
            background: #5a6fd8;
            transform: translateY(-2px);
        }

        @media (max-width: 768px) {
            .order-details {
                grid-template-columns: 1fr;
                gap: 10px;
            }
            
            .order-header {
                flex-direction: column;
                align-items: flex-start;
                gap: 10px;
            }
            
            .header h1 {
                font-size: 2rem;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📦 Pesanan Saya</h1>
            <p>Lihat riwayat dan status pesanan Anda</p>
        </div>

        <a href="index.php" class="back-btn">← Kembali ke Beranda</a>

        <div class="orders-grid">
            <?php if (count($orders) > 0): ?>
                <?php foreach ($orders as $order): ?>
                <div class="order-card">
                    <div class="order-header">
                        <div class="order-number">#<?= htmlspecialchars($order['order_number']) ?></div>
                        <div class="order-date"><?= date('d M Y H:i', strtotime($order['created_at'])) ?></div>
                    </div>
                    
                    <div class="order-details">
                        <div class="order-items">
                            <strong>Items:</strong><br>
                            <?= htmlspecialchars($order['items'] ?? 'Tidak ada item') ?>
                        </div>
                        <div class="order-total">
                            Rp<?= number_format($order['total_amount'], 0, ',', '.') ?>
                        </div>
                        <div class="order-address">
                            <strong>Alamat:</strong><br>
                            <?= htmlspecialchars(substr($order['shipping_address'], 0, 50)) ?>...
                        </div>
                        <div class="order-payment">
                            <strong>Pembayaran:</strong><br>
                            <?= htmlspecialchars($order['payment_method']) ?>
                        </div>
                    </div>
                    
                    <div class="order-footer">
                        <div>
                            <?= getStatusBadge($order['status']) ?>
                        </div>
                        <a href="order_detail.php?id=<?= $order['id'] ?>" class="shop-btn" style="padding: 8px 20px; font-size: 14px;">
                            Lihat Detail
                        </a>
                    </div>
                </div>
                <?php endforeach; ?>
            <?php else: ?>
                <div class="empty-state">
                    <h3>Belum ada pesanan</h3>
                    <p>Yuk, mulai berbelanja dan temukan fashion favoritmu!</p>
                    <a href="products.php" class="shop-btn">Mulai Belanja</a>
                </div>
            <?php endif; ?>
        </div>
    </div>
</body>
</html>