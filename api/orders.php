<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Credentials: true");

// Manually resume session from header if present
if (isset($_SERVER['HTTP_X_SESSION_ID'])) {
    session_id($_SERVER['HTTP_X_SESSION_ID']);
}

// Explicitly set session cookie parameters for local dev environment
session_set_cookie_params([
    'lifetime' => 86400, // 1 day
    'path' => '/',
    'domain' => 'localhost',
    'secure' => false, // Allow over HTTP
    'httponly' => true,
    'samesite' => 'Lax' // Lax is a good default for this scenario
]);

// ✅ TAMBAHKAN SESSION START untuk validasi user
session_start();

// Koneksi database
$host = "localhost";
$dbname = "haven_fashion";
$username = "root";
$password = "";

try {
    $conn = new PDO("mysql:host=$host;dbname=$dbname", $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch(PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    exit;
}

$action = $_GET['action'] ?? '';

if ($action == 'create_order') {
    // ✅ VALIDASI: Cek apakah user sudah login
    if (!isset($_SESSION['logged_in']) || $_SESSION['logged_in'] !== true) {
        echo json_encode(['success' => false, 'message' => 'Silakan login terlebih dahulu!']);
        exit;
    }
    
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    
    // ✅ GUNAKAN user_id dari SESSION, bukan dari input data (lebih aman)
    $user_id = $_SESSION['user_id']; // Ambil dari session, bukan dari $data
    $customer_name = $data['customer_name'] ?? '';
    $customer_email = $data['customer_email'] ?? '';
    $customer_phone = $data['customer_phone'] ?? '';
    $delivery_method = $data['delivery_method'] ?? '';
    $delivery_address = $data['delivery_address'] ?? '';
    $payment_method = $data['payment_method'] ?? '';
    $subtotal = $data['subtotal'] ?? 0;
    $shipping_cost = $data['shipping_cost'] ?? 0;
    $total_amount = $data['total_amount'] ?? 0;
    $items = $data['items'] ?? [];
    
    // ✅ VALIDASI DATA
    if (empty($customer_name) || empty($customer_email) || empty($items)) {
        echo json_encode(['success' => false, 'message' => 'Data tidak lengkap!']);
        exit;
    }
    
    try {
        $conn->beginTransaction();
        
        // Generate order number
        $order_number = 'HVN' . date('YmdHis') . rand(100, 999);
        
        // Insert order
        $stmt = $conn->prepare("INSERT INTO orders (
            order_number, user_id, customer_name, customer_email, customer_phone,
            delivery_method, delivery_address, payment_method,
            subtotal, shipping_cost, total_amount, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        
        $stmt->execute([
            $order_number, $user_id, $customer_name, $customer_email, $customer_phone,
            $delivery_method, $delivery_address, $payment_method,
            $subtotal, $shipping_cost, $total_amount, 'pending' // ✅ tambah status
        ]);
        
        $order_id = $conn->lastInsertId();
        
        // Insert order items
        $stmt = $conn->prepare("INSERT INTO order_items (order_id, product_name, product_price, size, quantity, subtotal) VALUES (?, ?, ?, ?, ?, ?)");
        
        foreach ($items as $item) {
            $item_subtotal = $item['price'] * $item['quantity'];
            $stmt->execute([
                $order_id,
                $item['name'],
                $item['price'],
                $item['size'],
                $item['quantity'],
                $item_subtotal
            ]);
        }
        
        $conn->commit();
        
        echo json_encode([
            'success' => true, 
            'message' => 'Order berhasil dibuat!',
            'order_number' => $order_number,
            'order_id' => $order_id
        ]);
        
    } catch (Exception $e) {
        $conn->rollBack();
        echo json_encode(['success' => false, 'message' => 'Gagal membuat order: ' . $e->getMessage()]);
    }
}
else if ($action == 'user_orders') {
    // ✅ TAMBAH ACTION UNTUK AMBIL ORDER USER
    if (!isset($_SESSION['logged_in']) || $_SESSION['logged_in'] !== true) {
        echo json_encode(['success' => false, 'message' => 'Silakan login terlebih dahulu!']);
        exit;
    }
    
    $user_id = $_SESSION['user_id'];
    
    try {
        // Ambil orders user
        $stmt = $conn->prepare("
            SELECT * FROM orders 
            WHERE user_id = ? 
            ORDER BY created_at DESC
        ");
        $stmt->execute([$user_id]);
        $orders = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Ambil items untuk setiap order
        foreach ($orders as &$order) {
            $stmt = $conn->prepare("
                SELECT * FROM order_items 
                WHERE order_id = ?
            ");
            $stmt->execute([$order['id']]);
            $order['items'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
        }
        
        echo json_encode([
            'success' => true,
            'orders' => $orders
        ]);
        
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => 'Gagal mengambil orders: ' . $e->getMessage()]);
    }
}
else if ($action == 'test') {
    echo json_encode(['success' => true, 'message' => 'Orders PHP is working!']);
}
else {
    echo json_encode(['success' => false, 'message' => 'Action tidak dikenali: ' . $action]);
}
?>