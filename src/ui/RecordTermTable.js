import React from "react";

const RecordTermTable = ({record,facetIds,onClick,facetTermCount,thWidth}) =>
    <table className="table table-bordered">
        <tbody>
            {facetIds.map(f => {
                let terms = !record[f] ? [] : Array.isArray(record[f]) ? record[f] : [record[f]];
                return (
                    <tr key={f}>
                        <th style={{width: !thWidth ? "" : thWidth}}>
                            {f}
                        </th>
                        <td>
                            {terms.map(t => 
                                <span key={t}
                                    className="badge bg-light text-dark me-2"
                                    style={{border:'1px solid #ddd', cursor: !onClick ? 'default' : 'pointer'}}
                                    onClick={!onClick ? () => {} : () => onClick(f,t.toString())}
                                >
                                    {t}
                                    {!!facetTermCount && <> ({facetTermCount(f,t)})</>}
                                </span>
                            )}
                        </td>
                    </tr>
                );
            })}
        </tbody>
    </table>;

export default RecordTermTable;