import React, { useState, useEffect } from 'react';
import axios from 'axios';

const DataRequest = () => {
    const [data, setData] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get('http://localhost:8000/api/data');
                setData(response.data);
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };

        fetchData();
    }, []);



    return (
        <div style={{ display: 'flex' }}>
            <div>
                <h1>API Data:</h1>
                {data && data.entity && data.entity.length > 0 ? (
                    <ul style={{ listStyleType: 'none', padding: 0 }}>
                        {data.entity.map((item) => (
                            <li key={item.id} style={{ margin: '5px', display: 'block' }}>
                                <button onClick={() => handleButtonClick(item.id)}>{item.id}</button>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p>Loading...</p>
                )}
            </div>
        </div>
    );
};

export default apionly;
