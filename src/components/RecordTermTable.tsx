import React from "react";
import { FieldValue, RecordValue } from "../model";

const RecordTermTable = ({
    record,
    facetIds,
    onClick,
    facetTermCount,
    thWidth,
    className
} : {
    record: RecordValue;
    facetIds: string[];
    onClick?: undefined | ((facetName: string, term: string) => void);
    facetTermCount: (facetName: string, term: string) => number;
    thWidth: string | undefined;
    className: string;
}) =>
    <table className={"table table-bordered " + (className || "")}>
        <tbody>
            {facetIds.map(f => {
                let terms: FieldValue[] = 
                    !(f in record) 
                    ? ([] as FieldValue[]) 
                    : Array.isArray(record[f]) 
                    ? (record[f] as unknown as FieldValue[])
                    : [record[f]];
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
                                    {!!facetTermCount && <> ({facetTermCount(f,t.toString())})</>}
                                </span>
                            )}
                        </td>
                    </tr>
                );
            })}
        </tbody>
    </table>;

export default RecordTermTable;