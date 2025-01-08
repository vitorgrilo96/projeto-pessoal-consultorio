<?php
session_start();

if (!isset($_SESSION['usuario_id'])) {
    header('Location: login.html');
    exit();
}

if ($_SESSION['usuario_papel'] == 'admin') {
    echo "Bem-vindo, admin! Você pode agendar e alterar horários.";
} else {
    echo "Bem-vindo, usuário! Você pode marcar suas consultas.";
}
?>
