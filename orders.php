<?php
// Konfigurasi database
$host = "localhost";
$dbname = "haven_fashion";
$username = "root";
$password = "";

// Konfigurasi tambahan
date_default_timezone_set('Asia/Jakarta');

try {
    $conn = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $conn->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
} catch(PDOException $e) {
    error_log("Koneksi database gagal: " . $e->getMessage());
    die("Terjadi kesalahan sistem. Silakan coba lagi nanti.");
}

// Ambil data pesanan dengan error handling
try {
    $stmt = $conn->prepare("SELECT id, order_number, created_at, status, total_amount FROM orders ORDER BY created_at DESC");
    $stmt->execute();
    $orders = $stmt->fetchAll();
} catch(PDOException $e) {
    error_log("Query pesanan gagal: " . $e->getMessage());
    $orders = [];
}
?>

<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Pesanan Saya - Haven Fashion</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        :root {
            --primary: #2c3e50;
            --secondary: #00bcd4; /* Diubah ke cyan/teal untuk warna biru kehijauan */
            --success: #27ae60;
            --warning: #f39c12;
            --danger: #e74c3c;
            --light: #f8f9fa;
            --dark: #343a40;
            --gray: #6c757d;
            --border: #dee2e6;
            --shadow: rgba(0, 0, 0, 0.1);
            --gradient: linear-gradient(135deg, #00bcd4 0%, #009688 100%); /* Gradien biru kehijauan */
        }
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: var(--gradient);
            line-height: 1.6;
            color: var(--dark);
            min-height: 100vh;
            padding: 20px;
        }
        
        .container {
            max-width: 1400px;
            margin: 0 auto;
        }
        
        .header {
            text-align: center;
            margin-bottom: 40px;
            padding: 30px;
            background: rgba(255, 255, 255, 0.9);
            border-radius: 20px;
            box-shadow: 0 15px 35px var(--shadow);
        }
        
        .header h1 {
            color: var(--primary);
            font-size: 3rem;
            margin-bottom: 10px;
            font-weight: 700;
            text-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .header p {
            color: var(--gray);
            font-size: 1.2rem;
        }
        
        .back-btn {
            display: inline-flex;
            align-items: center;
            gap: 10px;
            background: var(--secondary);
            color: white;
            padding: 15px 30px;
            border-radius: 50px;
            text-decoration: none;
            transition: all 0.3s ease;
            font-weight: 600;
            margin-bottom: 30px;
            box-shadow: 0 8px 20px rgba(0, 188, 212, 0.3); /* Shadow dengan warna baru */
        }
        
        .back-btn:hover {
            background: #0097a7; /* Hover lebih gelap */
            transform: translateY(-3px);
            box-shadow: 0 12px 30px rgba(0, 188, 212, 0.5);
        }
        
        .orders-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
            gap: 25px;
            margin-bottom: 40px;
        }
        
        .order-card {
            background: white;
            border-radius: 20px;
            box-shadow: 0 15px 35px var(--shadow);
            overflow: hidden;
            transition: all 0.3s ease;
            position: relative;
            opacity: 0;
            transform: translateY(20px);
            animation: fadeInUp 0.6s ease forwards;
        }
        
        .order-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 20px 50px rgba(0,0,0,0.2);
        }
        
        .order-card:nth-child(odd) {
            animation-delay: 0.1s;
        }
        
        .order-card:nth-child(even) {
            animation-delay: 0.2s;
        }
        
        .card-header {
            background: var(--gradient);
            color: white;
            padding: 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .card-header h3 {
            font-size: 1.2rem;
            font-weight: 600;
        }
        
        .order-number {
            font-weight: 700;
            font-size: 1.1rem;
        }
        
        .card-body {
            padding: 25px;
        }
        
        .order-info {
            display: flex;
            flex-direction: column;
            gap: 15px;
        }
        
        .info-item {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .info-item i {
            color: var(--secondary);
            width: 20px;
        }
        
        .status {
            display: inline-block;
            padding: 8px 16px;
            border-radius: 25px;
            font-size: 0.9rem;
            font-weight: 600;
            text-align: center;
        }
        
        .status-pending {
            background: linear-gradient(45deg, #fff3cd, #ffeaa7);
            color: #856404;
        }
        
        .status-confirmed {
            background: linear-gradient(45deg, #d1ecf1, #bee5eb);
            color: #0c5460;
        }
        
        .status-processing {
            background: linear-gradient(45deg, #d1ecf1, #bee5eb);
            color: #0c5460;
        }
        
        .status-shipped {
            background: linear-gradient(45deg, #d4edda, #c3e6cb);
            color: #155724;
        }
        
        .status-delivered {
            background: linear-gradient(45deg, #d4edda, #c3e6cb);
            color: #155724;
        }
        
        .status-cancelled {
            background: linear-gradient(45deg, #f8d7da, #f5c6cb);
            color: #721c24;
        }
        
        .total-amount {
            font-weight: 700;
            color: var(--primary);
            font-size: 1.2rem;
        }
        
        .btn {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 12px 24px;
            border-radius: 25px;
            text-decoration: none;
            font-weight: 600;
            transition: all 0.3s ease;
            border: none;
            cursor: pointer;
            font-size: 0.95rem;
            margin-top: 15px;
        }
        
        .btn-detail {
            background: var(--secondary);
            color: white;
            width: 100%;
            justify-content: center;
        }
        
        .btn-detail:hover {
            background: #0097a7;
            transform: scale(1.05);
            box-shadow: 0 8px 20px rgba(0, 188, 212, 0.4);
        }
        
        .no-data {
            text-align: center;
            padding: 80px 40px;
            background: white;
            border-radius: 20px;
            box-shadow: 0 15px 35px var(--shadow);
            margin-bottom: 40px;
        }
        
        .no-data i {
            font-size: 4rem;
            margin-bottom: 20px;
            color: var(--gray);
        }
        
        .no-data h3 {
            font-size: 1.8rem;
            margin-bottom: 15px;
            color: var(--primary);
        }
        
        .no-data p {
            margin-bottom: 30px;
            color: var(--gray);
        }
        
        .btn-primary {
            background: var(--primary);
            color: white;
            padding: 15px 30px;
            border-radius: 25px;
        }
        
        .btn-primary:hover {
            background: #1a252f;
            transform: scale(1.05);
        }
        
        .footer {
            text-align: center;
            margin-top: 60px;
            color: white;
            font-size: 1rem;
            background: rgba(0,0,0,0.1);
            padding: 20px;
            border-radius: 15px;
        }
        
        @keyframes fadeInUp {
            from {
                opacity: 0;
                transform: translateY(30px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        @media (max-width: 768px) {
            .orders-grid {
                grid-template-columns: 1fr;
                gap: 20px;
            }
            
            .header h1 {
                font-size: 2.5rem;
            }
            
            .card-body {
                padding: 20px;
            }
            
            .info-item {
                font-size: 0.9rem;
            }
        }
        
        @media (max-width: 576px) {
            .header h1 {
                font-size: 2rem;
            }
            
            .header p {
                font-size: 1rem;
            }
            
            .back-btn {
                padding: 12px 24px;
                font-size: 0.9rem;
            }
            
            .btn {
                padding: 10px 20px;
                font-size: 0.9rem;
            }
            
            .status {
                font-size: 0.8rem;
                padding: 6px 12px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <a href="index.html" class="back-btn">
            <i class="fas fa-arrow-left"></i> Kembali ke Beranda
        </a>
        
        <div class="header">
            <h1><i class="fas fa-shopping-bag"></i> Pesanan Saya</h1>
            <p>Kelola dan lacak pesanan Anda di Haven Fashion</p>
        </div>
        
        <?php if (count($orders) > 0): ?>
            <div class="orders-grid">
                <?php foreach ($orders as $index => $order): ?>
                <div class="order-card" style="animation-delay: <?= $index * 0.1 ?>s;">
                    <div class="card-header">
                        <h3><i class="fas fa-box"></i> Pesanan</h3>
                        <span class="order-number">#<?= htmlspecialchars($order['order_number']) ?></span>
                    </div>
                    <div class="card-body">
                        <div class="order-info">
                            <div class="info-item">
                                <i class="far fa-calendar"></i>
                                <span><strong>Tanggal:</strong> <?= date('d M Y', strtotime($order['created_at'])) ?> <small>(<?= date('H:i', strtotime($order['created_at'])) ?>)</small></span>
                            </div>
                            <div class="info-item">
                                <i class="fas fa-info-circle"></i>
                                <span><strong>Status:</strong></span>
                                <?php
                                $status = $order['status'] ?? 'pending';
                                $statusClass = 'status-' . $status;
                                
                                $statusMapping = [
                                    'pending' => 'Menunggu Konfirmasi',
                                    'confirmed' => 'Dikonfirmasi',
                                    'processing' => 'Diproses',
                                    'shipped' => 'Dikirim',
                                    'delivered' => 'Selesai',
                                    'cancelled' => 'Dibatalkan'
                                ];
                                
                                $displayStatus = $statusMapping[$status] ?? ucfirst($status);
                                
                                $statusIcons = [
                                    'pending' => 'fas fa-clock',
                                    'confirmed' => 'fas fa-check-circle',
                                    'processing' => 'fas fa-cogs',
                                    'shipped' => 'fas fa-shipping-fast',
                                    'delivered' => 'fas fa-box-open',
                                    'cancelled' => 'fas fa-times-circle'
                                ];
                                $statusIcon = $statusIcons[$status] ?? 'fas fa-info-circle';
                                ?>
                                <span class="status <?= $statusClass ?>">
                                    <i class="<?= $statusIcon ?>"></i> <?= $displayStatus ?>
                                </span>
                            </div>
                            <div class="info-item">
                                <i class="fas fa-tag"></i>
                                <span class="total-amount">Total: Rp<?= number_format($order['total_amount'], 0, ',', '.') ?></span>
                            </div>
                        </div>
                        <a href="order_detail.php?id=<?= $order['id'] ?>" class="btn btn-detail">
                            <i class="fas fa-eye"></i> Lihat Detail
                        </a>
                    </div>
                </div>
                <?php endforeach; ?>
            </div>
        <?php else: ?>
            <div class="no-data">
                <i class="fas fa-box-open"></i>
                <h3>Belum ada pesanan</h3>
                <p>Anda belum membuat pesanan apapun. Mulai berbelanja sekarang!</p>
                <a href="products.php" class="btn btn-primary">
                    <i class="fas fa-shopping-bag"></i> Jelajahi Produk
                </a>
            </div>
        <?php endif; ?>
        
        <div class="footer">
            <p>&copy; <?= date('Y') ?> Haven Fashion. Semua hak dilindungi.</p>
        </div>
    </div>
</body>
</html>
