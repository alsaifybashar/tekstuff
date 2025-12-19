import React, { useEffect, useState } from 'react';
import { Card, Form, Button, Row, Col, Spinner, Alert, Image } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, ArrowLeft, X, Upload } from 'lucide-react';

export default function ProductEditorPage() {
    const { id } = useParams();
    const isEditMode = !!id;
    const navigate = useNavigate();

    const [loading, setLoading] = useState(isEditMode);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [categories, setCategories] = useState([]);

    const [formData, setFormData] = useState({
        name: '',
        sku: '',
        price: '',
        comparePrice: '',
        costPrice: '',
        stockQuantity: '0',
        lowStockThreshold: '5',
        description: '',
        shortDescription: '',
        categoryId: '',
        isActive: true,
        isFeatured: false,
        metaTitle: '',
        metaDescription: '',
        tags: ''
    });

    const [existingImages, setExistingImages] = useState([]);
    const [newImages, setNewImages] = useState([]);
    const [previewImages, setPreviewImages] = useState([]);

    useEffect(() => {
        fetchCategories();
        if (isEditMode) {
            fetchProduct();
        }
    }, [id]);

    const fetchCategories = async () => {
        try {
            const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
            const res = await fetch(`${baseUrl}/categories`);
            const data = await res.json();
            if (data.success && data.data) {
                setCategories(data.data.categories || []);
            }
        } catch (e) {
            console.error("Failed to fetch categories", e);
        }
    };

    const fetchProduct = async () => {
        try {
            const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
            const res = await fetch(`${baseUrl}/products/${id}`);
            const data = await res.json();

            if (data.success) {
                const p = data.data.product;
                setFormData({
                    name: p.name || '',
                    sku: p.sku || '',
                    price: p.price || '',
                    comparePrice: p.comparePrice || '',
                    costPrice: p.costPrice || '',
                    stockQuantity: p.stockQuantity || '0',
                    lowStockThreshold: p.lowStockThreshold || '5',
                    description: p.description || '',
                    shortDescription: p.shortDescription || '',
                    categoryId: p.category?.id || '',
                    isActive: p.isActive,
                    isFeatured: p.isFeatured,
                    metaTitle: p.metaTitle || '',
                    metaDescription: p.metaDescription || '',
                    tags: p.tags ? p.tags.join(', ') : ''
                });
                setExistingImages(p.images || []);
            } else {
                setError("Kunde inte hämta produkt");
            }
        } catch (err) {
            setError("Serverfel vid hämtning av produkt");
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleFileChange = (e) => {
        if (e.target.files) {
            const filesArray = Array.from(e.target.files);
            setNewImages(prev => [...prev, ...filesArray]);

            // Generate previews
            const newPreviews = filesArray.map(file => URL.createObjectURL(file));
            setPreviewImages(prev => [...prev, ...newPreviews]);
        }
    };

    const removeNewImage = (index) => {
        setNewImages(prev => prev.filter((_, i) => i !== index));
        setPreviewImages(prev => prev.filter((_, i) => i !== index));
    };

    const removeExistingImage = (imgUrl) => {
        setExistingImages(prev => prev.filter(url => url !== imgUrl));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        try {
            const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
            const formPayload = new FormData();

            // Append simple fields
            Object.keys(formData).forEach(key => {
                if (key === 'tags') {
                    // Split tags into array? Backend expects array.
                    // But appending multiple values for same key works for multer/form-data arrays sometimes,
                    // or just send as comma separated and backend handles it?
                    // Backend controller expects array.
                    // Let's split it here or let backend helper do it.
                    // Controller says: Array.isArray(tags) ? tags : [] -- wait, if it comes from FormData text field, it's a string.
                    // Controller line 87 logic: if (tags) { const tagArray = ... } for GET.
                    // For CREATE, line 502: Array.isArray(tags). 
                    // We should probably send multiple 'tags' entries or one string and let backend parse?
                    // Let's send it as individual entries if we can, or just loop.
                    const tagsList = formData.tags.split(',').map(t => t.trim()).filter(Boolean);
                    tagsList.forEach(tag => formPayload.append('tags[]', tag));
                } else {
                    formPayload.append(key, formData[key]);
                }
            });

            // Append existing images (for update)
            existingImages.forEach(img => formPayload.append('existingImages', img));
            if (existingImages.length === 0 && isEditMode) {
                formPayload.append('clearImages', 'true');
            }

            // Append new files
            newImages.forEach(file => {
                formPayload.append('images', file);
            });

            const url = isEditMode ? `${baseUrl}/products/${id}` : `${baseUrl}/products`;
            const method = isEditMode ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method: method,
                // Header for Content-Type is auto-set by browser with boundary for FormData
                body: formPayload
            });

            const data = await res.json();

            if (data.success) {
                navigate('/admin/products');
            } else {
                setError(data.message || 'Ett fel uppstod');
            }

        } catch (err) {
            console.error(err);
            setError("Nätverksfel");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="text-center py-5"><Spinner animation="border" /></div>;

    return (
        <div className="container-fluid pb-5">
            <Form onSubmit={handleSubmit}>
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div className="d-flex align-items-center gap-3">
                        <Button variant="light" className="rounded-circle p-2" onClick={() => navigate('/admin/products')}>
                            <ArrowLeft size={20} />
                        </Button>
                        <div>
                            <h2 className="fw-bold mb-1">{isEditMode ? 'Redigera Produkt' : 'Ny Produkt'}</h2>
                            <p className="text-muted mb-0">{isEditMode ? `ID: ${id}` : 'Skapa en ny produkt i sortimentet'}</p>
                        </div>
                    </div>
                    <div className="d-flex gap-2">
                        <Button variant="outline-secondary" onClick={() => navigate('/admin/products')}>Avbryt</Button>
                        <Button variant="primary" type="submit" disabled={submitting} className="d-flex align-items-center gap-2">
                            {submitting ? <Spinner size="sm" /> : <Save size={18} />} Spara
                        </Button>
                    </div>
                </div>

                {error && <Alert variant="danger" onClose={() => setError(null)} dismissible>{error}</Alert>}

                <Row className="g-4">
                    <Col lg={8}>
                        {/* General Info */}
                        <Card className="border-0 shadow-sm rounded-4 mb-4">
                            <Card.Header className="bg-white py-3 px-4 fw-bold">Grundinformation</Card.Header>
                            <Card.Body className="p-4">
                                <Form.Group className="mb-3">
                                    <Form.Label>Produktnamn</Form.Label>
                                    <Form.Control
                                        type="text" name="name" required
                                        value={formData.name} onChange={handleChange}
                                        placeholder="t.ex. Premium Hörlurar"
                                    />
                                </Form.Group>
                                <Row>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>SKU (Artikelnummer)</Form.Label>
                                            <Form.Control
                                                type="text" name="sku" required
                                                value={formData.sku} onChange={handleChange}
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Kategori</Form.Label>
                                            <Form.Select name="categoryId" value={formData.categoryId} onChange={handleChange}>
                                                <option value="">Välj kategori...</option>
                                                {categories.map(c => (
                                                    <option key={c.id} value={c.id}>{c.name}</option>
                                                ))}
                                            </Form.Select>
                                        </Form.Group>
                                    </Col>
                                </Row>
                                <Form.Group className="mb-3">
                                    <Form.Label>Beskrivning</Form.Label>
                                    <Form.Control
                                        as="textarea" rows={6} name="description"
                                        value={formData.description} onChange={handleChange}
                                    />
                                </Form.Group>
                                <Form.Group className="mb-0">
                                    <Form.Label>Kort Beskrivning (för listor)</Form.Label>
                                    <Form.Control
                                        as="textarea" rows={2} name="shortDescription"
                                        value={formData.shortDescription} onChange={handleChange}
                                    />
                                </Form.Group>
                            </Card.Body>
                        </Card>

                        {/* Media */}
                        <Card className="border-0 shadow-sm rounded-4 mb-4">
                            <Card.Header className="bg-white py-3 px-4 fw-bold">Bilder</Card.Header>
                            <Card.Body className="p-4">
                                <div className="mb-3">
                                    <Form.Label className="btn btn-outline-primary d-inline-flex align-items-center gap-2">
                                        <Upload size={18} /> Ladda upp bilder
                                        <input type="file" hidden multiple accept="image/*" onChange={handleFileChange} />
                                    </Form.Label>
                                </div>

                                <div className="d-flex flex-wrap gap-3">
                                    {existingImages.map((img, idx) => (
                                        <div key={`exist-${idx}`} className="position-relative border rounded p-1" style={{ width: 100, height: 100 }}>
                                            <Image src={img} className="w-100 h-100 object-fit-cover rounded" />
                                            <Button
                                                size="sm" variant="danger"
                                                className="position-absolute top-0 end-0 p-0 d-flex align-items-center justify-content-center rounded-circle"
                                                style={{ width: 20, height: 20, transform: 'translate(30%, -30%)' }}
                                                onClick={() => removeExistingImage(img)}
                                            >
                                                <X size={12} />
                                            </Button>
                                        </div>
                                    ))}
                                    {previewImages.map((img, idx) => (
                                        <div key={`new-${idx}`} className="position-relative border rounded p-1" style={{ width: 100, height: 100 }}>
                                            <Image src={img} className="w-100 h-100 object-fit-cover rounded" />
                                            <Button
                                                size="sm" variant="danger"
                                                className="position-absolute top-0 end-0 p-0 d-flex align-items-center justify-content-center rounded-circle"
                                                style={{ width: 20, height: 20, transform: 'translate(30%, -30%)' }}
                                                onClick={() => removeNewImage(idx)}
                                            >
                                                <X size={12} />
                                            </Button>
                                            <Badge bg="success" className="position-absolute bottom-0 start-50 translate-middle-x mb-1" style={{ fontSize: '0.6rem' }}>Ny</Badge>
                                        </div>
                                    ))}
                                </div>
                            </Card.Body>
                        </Card>

                        {/* SEO */}
                        <Card className="border-0 shadow-sm rounded-4">
                            <Card.Header className="bg-white py-3 px-4 fw-bold">SEO (Sökmotoroptimering)</Card.Header>
                            <Card.Body className="p-4">
                                <Form.Group className="mb-3">
                                    <Form.Label>Meta Titel</Form.Label>
                                    <Form.Control
                                        type="text" name="metaTitle"
                                        value={formData.metaTitle} onChange={handleChange}
                                    />
                                </Form.Group>
                                <Form.Group className="mb-0">
                                    <Form.Label>Meta Beskrivning</Form.Label>
                                    <Form.Control
                                        as="textarea" rows={2} name="metaDescription"
                                        value={formData.metaDescription} onChange={handleChange}
                                    />
                                </Form.Group>
                            </Card.Body>
                        </Card>
                    </Col>

                    <Col lg={4}>
                        {/* Status */}
                        <Card className="border-0 shadow-sm rounded-4 mb-4">
                            <Card.Header className="bg-white py-3 px-4 fw-bold">Status</Card.Header>
                            <Card.Body className="p-4">
                                <Form.Check
                                    type="switch"
                                    id="active-switch"
                                    label="Aktiv (synlig i butik)"
                                    name="isActive"
                                    checked={formData.isActive}
                                    onChange={handleChange}
                                    className="mb-3"
                                />
                                <Form.Check
                                    type="switch"
                                    id="featured-switch"
                                    label="Utvald produkt"
                                    name="isFeatured"
                                    checked={formData.isFeatured}
                                    onChange={handleChange}
                                />
                            </Card.Body>
                        </Card>

                        {/* Pricing */}
                        <Card className="border-0 shadow-sm rounded-4 mb-4">
                            <Card.Header className="bg-white py-3 px-4 fw-bold">Prissättning</Card.Header>
                            <Card.Body className="p-4">
                                <Form.Group className="mb-3">
                                    <Form.Label>Pris (SEK)</Form.Label>
                                    <Form.Control
                                        type="number" name="price" required
                                        value={formData.price} onChange={handleChange}
                                    />
                                </Form.Group>
                                <Form.Group className="mb-3">
                                    <Form.Label>Jämförpris (Rea)</Form.Label>
                                    <Form.Control
                                        type="number" name="comparePrice"
                                        value={formData.comparePrice} onChange={handleChange}
                                    />
                                </Form.Group>
                                <Form.Group className="mb-0">
                                    <Form.Label>Inköpspris (Kostnad)</Form.Label>
                                    <Form.Control
                                        type="number" name="costPrice"
                                        value={formData.costPrice} onChange={handleChange}
                                    />
                                </Form.Group>
                            </Card.Body>
                        </Card>

                        {/* Inventory */}
                        <Card className="border-0 shadow-sm rounded-4 mb-4">
                            <Card.Header className="bg-white py-3 px-4 fw-bold">Lager</Card.Header>
                            <Card.Body className="p-4">
                                <Form.Group className="mb-3">
                                    <Form.Label>Antal i lager</Form.Label>
                                    <Form.Control
                                        type="number" name="stockQuantity"
                                        value={formData.stockQuantity} onChange={handleChange}
                                    />
                                </Form.Group>
                                <Form.Group className="mb-0">
                                    <Form.Label>Varning vid lågt lager</Form.Label>
                                    <Form.Control
                                        type="number" name="lowStockThreshold"
                                        value={formData.lowStockThreshold} onChange={handleChange}
                                    />
                                </Form.Group>
                            </Card.Body>
                        </Card>

                        {/* Organization */}
                        <Card className="border-0 shadow-sm rounded-4">
                            <Card.Header className="bg-white py-3 px-4 fw-bold">Organisering</Card.Header>
                            <Card.Body className="p-4">
                                <Form.Group className="mb-0">
                                    <Form.Label>Taggar (kommaseparerade)</Form.Label>
                                    <Form.Control
                                        type="text" name="tags"
                                        value={formData.tags} onChange={handleChange}
                                        placeholder="Nyhet, Rea, Sommar..."
                                    />
                                </Form.Group>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </Form>
        </div>
    );
}
