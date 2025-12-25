export default function LoadingMssg({bool}) {
    return(
    bool && (
         <h1 className="report-generation__status">
           Report is generating, please wait...
         </h1>
       )

)}