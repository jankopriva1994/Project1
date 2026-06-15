<?php
// Jednoduchý mailer proxy – volá ho backend přes HTTPS
header('Content-Type: application/json');

$secret = getenv('MAILER_SECRET') ?: 'chaties-mailer-2026';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$body = json_decode(file_get_contents('php://input'), true);

if (!$body || ($body['secret'] ?? '') !== $secret) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

$to      = $body['to'] ?? '';
$subject = $body['subject'] ?? '';
$html    = $body['html'] ?? '';
$from    = $body['from'] ?? 'noreply@chaties.cz';

if (!$to || !$subject || !$html) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing fields']);
    exit;
}

$headers  = "MIME-Version: 1.0\r\n";
$headers .= "Content-Type: text/html; charset=UTF-8\r\n";
$headers .= "From: Chaties AI <{$from}>\r\n";
$headers .= "Reply-To: {$from}\r\n";

$ok = mail($to, $subject, $html, $headers);

if ($ok) {
    echo json_encode(['success' => true]);
} else {
    http_response_code(500);
    echo json_encode(['error' => 'mail() failed']);
}
