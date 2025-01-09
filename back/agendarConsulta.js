document.getElementById('formAgendarConsulta').addEventListener('submit', async (event) => {
    event.preventDefault();

    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData.entries());

    try {
        const token = localStorage.getItem('token');
        if (!token) {
            alert('Você precisa estar logado para agendar uma consulta.');
            return;
        }

        const response = await fetch('/agendar', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(data),
        });

        if (response.ok) {
            const result = await response.json();
            alert(result.message);
        } else {
            const error = await response.json();
            alert(error.message || 'Erro ao agendar consulta.');
        }
    } catch (err) {
        console.error(err);
        alert('Erro no servidor.');
    }
});
