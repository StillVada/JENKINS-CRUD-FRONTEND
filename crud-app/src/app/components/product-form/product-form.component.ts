import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductService } from '../../services/product.service';
import { Product, CreateProductRequest, UpdateProductRequest } from '../../models/product.interface';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './product-form.component.html',
  styleUrls: ['./product-form.component.css']
})
export class ProductFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private productService = inject(ProductService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  productForm!: FormGroup;
  isEditMode = signal<boolean>(false);
  loading = signal<boolean>(false);
  saving = signal<boolean>(false);
  error = signal<string | null>(null);
  productId = signal<number | null>(null);

  ngOnInit(): void {
    this.initializeForm();
    this.checkEditMode();
  }

  private initializeForm(): void {
    this.productForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(100)]],
      description: ['', [Validators.required, Validators.maxLength(500)]],
      price: ['', [Validators.required, Validators.min(0)]]
    });
  }

  private checkEditMode(): void {
    const id = this.route.snapshot.params['id'];
    if (id) {
      this.isEditMode.set(true);
      this.productId.set(+id);
      this.loadProduct(+id);
    }
  }

  private loadProduct(id: number): void {
    this.loading.set(true);
    this.error.set(null);

    this.productService.getProductById(id).subscribe({
      next: (product) => {
        this.productForm.patchValue({
          name: product.name,
          description: product.description,
          price: product.price
        });
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(`Failed to load product: ${err.message}`);
        this.loading.set(false);
      }
    });
  }

  onSubmit(): void {
    if (this.productForm.valid) {
      this.saving.set(true);
      this.error.set(null);

      const formValue = this.productForm.value;

      if (this.isEditMode()) {
        this.updateProduct(this.productId()!, formValue);
      } else {
        this.createProduct(formValue);
      }
    } else {
      this.markFormGroupTouched();
    }
  }

  private createProduct(productData: CreateProductRequest): void {
    this.productService.createProduct(productData).subscribe({
      next: (product) => {
        this.saving.set(false);
        this.router.navigate(['/products'], {
          queryParams: { message: 'Product created successfully' }
        });
      },
      error: (err) => {
        this.error.set(`Failed to create product: ${err.message}`);
        this.saving.set(false);
      }
    });
  }

  private updateProduct(id: number, productData: UpdateProductRequest): void {
    this.productService.updateProduct(id, productData).subscribe({
      next: (product) => {
        this.saving.set(false);
        this.router.navigate(['/products'], {
          queryParams: { message: 'Product updated successfully' }
        });
      },
      error: (err) => {
        this.error.set(`Failed to update product: ${err.message}`);
        this.saving.set(false);
      }
    });
  }

  private markFormGroupTouched(): void {
    Object.keys(this.productForm.controls).forEach(key => {
      const control = this.productForm.get(key);
      control?.markAsTouched();
    });
  }

  onCancel(): void {
    this.router.navigate(['/products']);
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.productForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.productForm.get(fieldName);
    if (field && field.errors && (field.dirty || field.touched)) {
      if (field.errors['required']) {
        return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} is required`;
      }
      if (field.errors['maxlength']) {
        return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} must be less than ${field.errors['maxlength'].requiredLength} characters`;
      }
      if (field.errors['min']) {
        return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} must be at least ${field.errors['min'].min}`;
      }
    }
    return '';
  }
}
