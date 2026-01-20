<?php
// --- START OF SUPER-DEFENSIVE ERROR HANDLING & LOGGING ---
error_reporting(E_ALL);
ini_set('display_errors', 0); // Never display errors to the browser
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/_php_errors.log'); // Log errors to a local file
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

if ($action == 'register') {
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    
    $name = $data['name'] ?? '';
    $email = $data['email'] ?? '';
    $phone = $data['phone'] ?? '';
    $password = $data['password'] ?? '';
    
    if (empty($name) || empty($email) || empty($password)) {
        echo json_encode(['success' => false, 'message' => 'Nama, email, dan password harus diisi']);
        exit;
    }
    
    // Cek email sudah ada
    $stmt = $conn->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->execute([$email]);
    
    if ($stmt->rowCount() > 0) {
        echo json_encode(['success' => false, 'message' => 'Email sudah terdaftar']);
        exit;
    }
    
    // Hash password
    $hashed_password = password_hash($password, PASSWORD_DEFAULT);
    
    // Insert user baru
    $stmt = $conn->prepare("INSERT INTO users (name, email, phone, password) VALUES (?, ?, ?, ?)");
    
    if ($stmt->execute([$name, $email, $phone, $hashed_password])) {
        $user_id = $conn->lastInsertId();
        
        echo json_encode([
            'success' => true, 
            'message' => 'Registrasi berhasil!',
            'user' => [
                'id' => $user_id,
                'name' => $name,
                'email' => $email,
                'phone' => $phone
            ]
        ]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Registrasi gagal']);
    }
}
else if ($action == 'login') {
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    
    $email = $data['email'] ?? '';
    $password = $data['password'] ?? '';
    
    if (empty($email) || empty($password)) {
        echo json_encode(['success' => false, 'message' => 'Email dan password harus diisi']);
        exit;
    }
    
    $stmt = $conn->prepare("SELECT id, name, email, phone, password FROM users WHERE email = ?");
    $stmt->execute([$email]);
    
    if ($stmt->rowCount() === 1) {
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // Verifikasi password
        if (password_verify($password, $user['password'])) {
            // ✅ TAMBAHKIN SESSION SET DI LOGIN
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['user_name'] = $user['name'];
            $_SESSION['user_email'] = $user['email'];
            $_SESSION['user_phone'] = $user['phone'];
            $_SESSION['logged_in'] = true;
            
            echo json_encode([
                'success' => true, 
                'message' => 'Login berhasil!',
                'user' => [
                    'id' => $user['id'],
                    'name' => $user['name'],
                    'email' => $user['email'],
                    'phone' => $user['phone']
                ],
                'session_id' => session_id() // Manually send session ID to the client
            ]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Password salah']);
        }
    } else {
        echo json_encode(['success' => false, 'message' => 'Email tidak terdaftar']);
    }
}
else if ($action == 'check_auth') {
    // ✅ TAMBAHKIN ACTION CHECK_AUTH
    if (isset($_SESSION['logged_in']) && $_SESSION['logged_in'] === true) {
        echo json_encode([
            'success' => true,
            'user' => [
                'id' => $_SESSION['user_id'],
                'name' => $_SESSION['user_name'],
                'email' => $_SESSION['user_email'],
                'phone' => $_SESSION['user_phone']
            ]
        ]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Not logged in']);
    }
}
else if ($action == 'logout') {
    // ✅ TAMBAHKIN ACTION LOGOUT
    session_destroy();
    $_SESSION = array();
    
    echo json_encode(['success' => true, 'message' => 'Logout berhasil']);
}
else if ($action == 'update_profile') {
    // ✅ TAMBAHKIN SESSION CHECK DI UPDATE_PROFILE
    if (!isset($_SESSION['logged_in']) || $_SESSION['logged_in'] !== true) {
        echo json_encode(['success' => false, 'message' => 'Silakan login terlebih dahulu']);
        exit;
    }
    
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    
    $user_id = $_SESSION['user_id'];
    $name = $data['name'] ?? '';
    $email = $data['email'] ?? '';
    $phone = $data['phone'] ?? '';
    $birth_date = $data['birth_date'] ?? '';
    $gender = $data['gender'] ?? '';
    $address = $data['address'] ?? '';
    $province = $data['province'] ?? '';
    $city = $data['city'] ?? '';
    $district = $data['district'] ?? '';
    $postal_code = $data['postal_code'] ?? '';
    
    // Update database
    $stmt = $conn->prepare("UPDATE users SET name = ?, email = ?, phone = ?, birth_date = ?, gender = ?, address = ?, province = ?, city = ?, district = ?, postal_code = ? WHERE id = ?");
    
    if ($stmt->execute([$name, $email, $phone, $birth_date, $gender, $address, $province, $city, $district, $postal_code, $user_id])) {
        // Update session juga
        $_SESSION['user_name'] = $name;
        $_SESSION['user_email'] = $email;
        $_SESSION['user_phone'] = $phone;
        
        echo json_encode([
            'success' => true,
            'message' => 'Profil berhasil diperbarui',
            'user' => [
                'id' => $user_id,
                'name' => $name,
                'email' => $email,
                'phone' => $phone,
                'birth_date' => $birth_date,
                'gender' => $gender,
                'address' => $address,
                'province' => $province,
                'city' => $city,
                'district' => $district,
                'postal_code' => $postal_code
            ]
        ]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Gagal memperbarui profil']);
    }
}
else if ($action == 'test') {
    echo json_encode(['success' => true, 'message' => 'Auth PHP is working!']);
}
else {
    echo json_encode(['success' => false, 'message' => 'Action tidak dikenali: ' . $action]);
}
?>