import React from 'react';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';

const EstatisticaUtilizadores = ({ icon, cor, titulo, valor, percentagem, descricao }) => {
    return (
        <div className="flex justify-between items-center bg-slate-800 text-white p-4 rounded-lg shadow-md w-full">
            <div className="flex gap-4 items-center">
                <div className={`text-3xl`} style={{ color: cor }}>{icon}</div>
                <div>
                    <div className="text-xl font-bold">{valor.toLocaleString()}</div>
                    <div className="text-sm text-gray-400">{descricao}</div>
                </div>
            </div>
            <div className="flex flex-col items-center">
                <div style={{ width: 40, height: 40 }}>
                    <CircularProgressbar
                        value={percentagem}
                        styles={buildStyles({
                            pathColor: cor,
                            trailColor: "#1e293b",
                        })}
                    />
                </div>
                <small className="text-green-400 mt-1">+{percentagem}%</small>
            </div>
        </div>
    );
};

export default EstatisticaUtilizadores;
