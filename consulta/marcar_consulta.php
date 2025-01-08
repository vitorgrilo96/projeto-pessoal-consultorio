<?php
$conn = new mysqli('localhost', 'root', '', 'consultorio');

if ($conn->connect_error) {
    die("Conexão falhou: " . $conn->connect_error);
}

$nome = $_POST['nome'];
$email = $_POST['email'];
$data = $_POST['data'];
$hora = $_POST['hora'];
$motivo = $_POST['motivo'];

$sql = "INSERT INTO consultas (nome, email, data, hora, motivo) 
        VALUES ('$nome', '$email', '$data', '$hora', '$motivo')";

if ($conn->query($sql) === TRUE) {
    echo "Consulta agendada com sucesso!";
} else {
    echo "Erro: " . $conn->error;
}

$conn->close();
?>
