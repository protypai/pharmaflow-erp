import React from 'react';
import { Database } from 'lucide-react';
export default function Backup() { return (<div className="card"><div className="card-header"><h2 className="card-title">Local Backup</h2></div><div className="card-body"><button className="btn btn-primary"><Database size={16}/> Trigger Local Backup</button></div></div>); }