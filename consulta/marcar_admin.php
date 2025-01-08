<?php
$conn = new mysqli('localhost', 'root', '', 'consultorio');

$sql = "SELECT * FROM consultas ORDER BY data, hora";
$result = $conn->query($sql);

if ($result->num_rows > 0) {
    echo "<table border='1'><tr><th>Data</th><th>Hora</th><th>Nome</th><th>E-mail</th><th>Motivo</th></tr>";
    while($row = $result->fetch_assoc()) {
        echo "<tr>
                <td>{$row['data']}</td>
                <td>{$row['hora']}</td>
                <td>{$row['nome']}</td>
                <td>{$row['email']}</td>
                <td>{$row['motivo']}</td>
              </tr>";
    }
    echo "</table>";
} else {
    echo "Nenhuma consulta marcada.";
}

$conn->close();
?>
