<?php
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

header('Content-Type: application/json; charset=utf-8');

require __DIR__ . '/vendor/autoload.php';

/*
  Si config-mail.php está fuera de public_html:
  require __DIR__ . '/../config-mail.php';

  Si lo pones dentro de public_html:
  require __DIR__ . '/config-mail.php';
*/

$config = require __DIR__ . '/../config-mail.php';

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
  echo json_encode([
    "success" => false,
    "message" => "Método no permitido."
  ]);
  exit;
}

// Honeypot anti-spam
if (!empty($_POST["website"])) {
  echo json_encode([
    "success" => false,
    "message" => "Solicitud bloqueada."
  ]);
  exit;
}

$name = trim($_POST["name"] ?? "");
$email = trim($_POST["email"] ?? "");
$message = trim($_POST["message"] ?? "");

if ($name === "" || $email === "" || $message === "") {
  echo json_encode([
    "success" => false,
    "message" => "Por favor, rellena todos los campos."
  ]);
  exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
  echo json_encode([
    "success" => false,
    "message" => "El correo electrónico no es válido."
  ]);
  exit;
}

try {
  $mail = new PHPMailer(true);

  $mail->isSMTP();
  $mail->Host = $config["smtp_host"];
  $mail->SMTPAuth = true;
  $mail->Username = $config["smtp_user"];
  $mail->Password = $config["smtp_pass"];
  $mail->SMTPSecure = $config["smtp_secure"];
  $mail->Port = $config["smtp_port"];

  $mail->CharSet = "UTF-8";

  $mail->setFrom($config["from_email"], $config["from_name"]);
  $mail->addAddress($config["to_email"]);
  $mail->addReplyTo($email, $name);

  $mail->Subject = "Nuevo mensaje desde la web de Bar ZEMNU";

  $mail->Body =
    "Has recibido un nuevo mensaje desde la web de Bar ZEMNU.\n\n" .
    "Nombre:\n" . $name . "\n\n" .
    "Correo:\n" . $email . "\n\n" .
    "Mensaje:\n" . $message . "\n";

  $mail->send();

  echo json_encode([
    "success" => true,
    "message" => "Mensaje enviado correctamente. Te responderemos pronto."
  ]);
} catch (Exception $e) {
  echo json_encode([
    "success" => false,
    "message" => "Error SMTP: " . $mail->ErrorInfo
  ]);
}