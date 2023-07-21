import React, { useRef } from 'react';
import { Toast } from 'primereact/toast';
import { FileUpload } from 'primereact/fileupload';
import { Button } from 'primereact/button';
import { Tooltip } from 'primereact/tooltip';
import { Tag } from 'primereact/tag';
import './App.css';

const ipcRenderer = window.require("electron").ipcRenderer;

function App() {
  const toast = useRef(null);
    const excelFileUploadRef = useRef(null);
    const fastaFileUploadRef = useRef(null);

  const headerTemplate = (options) => {
      const { className, chooseButton, uploadButton, cancelButton } = options;

      return (
          <div className={className} style={{ backgroundColor: 'transparent', display: 'flex', alignItems: 'center' }}>
              {chooseButton}
              {uploadButton}
              {cancelButton}
          </div>
      );
  };

  const handleUpload = async () => {
    
    const excelFile = excelFileUploadRef.current.getFiles()[0]
    const fastaFile = fastaFileUploadRef.current.getFiles()[0]

    toast.current.show({ severity: 'info', summary: 'Processing', detail: 'Sequences Are Being Parsed, an alert like this one will let you know when they are done' });

    // let excel = await ipcRenderer.invoke("path-to-buffer", excelFile.path)
    let saved = await ipcRenderer.invoke("path-to-buffer", excelFile.path, fastaFile.path)
    console.log("dna sequence text files:",saved)

    let toExcel = await ipcRenderer.invoke("save-excel", saved, excelFile.path)
    console.log(toExcel)
    toast.current.show({ sticky:"true", severity: 'success', summary: 'Success', detail: 'Sequences Have Been Parsed' });
  };

  const itemTemplate = (file, props) => {
      return (
          <div className="flex align-items-center flex-wrap">
              <div className="flex align-items-center" style={{ width: '60%' }}>
                  <span className="flex flex-column text-left ml-3">
                      {file.name}
                      <small>{new Date().toLocaleDateString()}</small>
                  </span>
              </div>
              <Tag value={props.formatSize} severity="warning" className="px-3 py-2" />
          </div>
      );
  };

  const emptyExcelTemplate = () => {
      return (
          <div className="flex align-items-center flex-column">
              <i className="pi pi-image mt-3 p-5" style={{ fontSize: '5em', borderRadius: '50%', backgroundColor: 'var(--surface-b)', color: 'var(--surface-d)' }}></i>
              <span style={{ fontSize: '1.2em', color: 'var(--text-color-secondary)' }} className="my-5">
                  Drag and Drop Excel Doc Here
              </span>
          </div>
      );
  };
  const emptyFastaTemplate = () => {
      return (
          <div className="flex align-items-center flex-column">
              <i className="pi pi-image mt-3 p-5" style={{ fontSize: '5em', borderRadius: '50%', backgroundColor: 'var(--surface-b)', color: 'var(--surface-d)' }}></i>
              <span style={{ fontSize: '1.2em', color: 'var(--text-color-secondary)' }} className="my-5">
                  Drag and Drop Fasta File Here
              </span>
          </div>
      );
  };

  const chooseOptions = { icon: 'pi pi-fw pi-images', iconOnly: true, className: 'custom-choose-btn p-button-rounded p-button-outlined' };
  const uploadOptions = { icon: 'pi pi-fw pi-cloud-upload', iconOnly: true, className: 'custom-upload-btn p-button-success p-button-rounded p-button-outlined', style:{display:"none"}};
  const cancelOptions = { icon: 'pi pi-fw pi-times', iconOnly: true, className: 'custom-cancel-btn p-button-danger p-button-rounded p-button-outlined' };

  return (
    <div style={{display:"flex", justifyContent:"space-evenly", flexWrap:"wrap"}}>
        <Toast ref={toast}></Toast>
        <div style={{flexBasis:"49%"}}>
            

            <Tooltip target=".custom-choose-btn" content="Choose" position="bottom" />
            <Tooltip target=".custom-cancel-btn" content="Clear" position="bottom" />

            <FileUpload ref={excelFileUploadRef} name="excel-file-upload"
                headerTemplate={headerTemplate} itemTemplate={itemTemplate} emptyTemplate={emptyExcelTemplate}
                chooseOptions={chooseOptions} uploadOptions={uploadOptions} cancelOptions={cancelOptions} accept='.xlsx'/>
        </div>
        <div  style={{flexBasis:"49%"}}>

            <Tooltip target=".custom-choose-btn" content="Choose" position="bottom" />
            <Tooltip target=".custom-cancel-btn" content="Clear" position="bottom" />

            <FileUpload ref={fastaFileUploadRef} name="fasta-file-upload"
                headerTemplate={headerTemplate} itemTemplate={itemTemplate} emptyTemplate={emptyFastaTemplate}
                chooseOptions={chooseOptions} uploadOptions={uploadOptions} cancelOptions={cancelOptions} accept='.fasta'/>
        </div>
        <div style={{flexBasis:"100%", textAlign:"center", marginTop:"50px"}}>
            <Button onClick={handleUpload}>Get Sequences</Button>
        </div>
    </div>
      
  )
}

export default App;
