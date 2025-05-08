import React from 'react';
import { FaChalkboardTeacher, FaPlus, FaBook, FaUniversity } from 'react-icons/fa';
import { Link, useLocation } from 'react-router-dom';
import './SidebarAdmin.css';

const SidebarAdmin = () => {
    const location = useLocation();

    const links = [
        { path: '/admin/dashboard', icon: <FaChalkboardTeacher />, label: 'Dashboard' },
        { path: '/admin/adicionar-curso', icon: <FaBook />, label: 'Adicionar Curso' },
        { path: '/admin/adicionar-unidade-curricular', icon: <FaUniversity />, label: 'Adicionar UC' },
        { path: '/admin/adicionar-docente', icon: <FaPlus />, label: 'Adicionar Docente' },
    ];

    return (
        <aside className="sidebar-admin">
            <nav className="sidebar-menu">
                {links.map((link, index) => (
                    <Link
                        key={index}
                        to={link.path}
                        className={`sidebar-link ${location.pathname === link.path ? 'active' : ''}`}
                    >
                        <span className="sidebar-icon">{link.icon}</span>
                        <span>{link.label}</span>
                    </Link>
                ))}
                <Link to="/user" className="sidebar-link">
                    <span>Ir para Utilizador</span>
                </Link>

            </nav>
        </aside>
        
    );
};

export default SidebarAdmin;
